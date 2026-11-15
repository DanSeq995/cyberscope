import { BufferGeometry, Group, Material, Mesh, MeshStandardMaterial, Object3D } from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

/**
 * Gli export GLB hanno estensioni clearcoat/specular/ior/transmission: GLTFLoader crea
 * MeshPhysicalMaterial e, con transmission > 0, three.js renderizza la scena una seconda volta
 * a ogni frame. Qui li sostituiamo con MeshStandardMaterial opachi (stesse texture).
 */
const standardCache = new WeakMap<Material, MeshStandardMaterial>()

export function toOpaqueStandard(src: Material): MeshStandardMaterial {
  const cached = standardCache.get(src)
  if (cached) return cached

  const s = src as MeshStandardMaterial
  const mat = new MeshStandardMaterial({
    name: s.name,
    color: s.color?.clone(),
    map: s.map ?? null,
    normalMap: s.normalMap ?? null,
    roughness: s.roughness ?? 1,
    roughnessMap: s.roughnessMap ?? null,
    metalness: s.metalness ?? 0,
    metalnessMap: s.metalnessMap ?? null,
    aoMap: s.aoMap ?? null,
    aoMapIntensity: s.aoMapIntensity ?? 1,
    emissive: s.emissive?.clone(),
    emissiveMap: s.emissiveMap ?? null,
    emissiveIntensity: s.emissiveIntensity ?? 1,
    side: s.side,
    vertexColors: s.vertexColors,
    flatShading: s.flatShading,
  })
  if (s.normalScale) mat.normalScale.copy(s.normalScale)
  standardCache.set(src, mat)
  return mat
}

/** Converte in place tutti i materiali delle mesh di `root`. */
export function makeMaterialsStandard(root: Object3D) {
  root.traverse((obj) => {
    if (!(obj instanceof Mesh)) return
    obj.material = Array.isArray(obj.material)
      ? obj.material.map(toOpaqueStandard)
      : toOpaqueStandard(obj.material)
  })
}

function geometryKey(geo: BufferGeometry): string {
  return `${geo.index ? 'i' : 'n'}:${Object.keys(geo.attributes).sort().join(',')}`
}

/**
 * Unisce le mesh visibili di `root` per materiale (trasformazioni applicate ai vertici):
 * da centinaia di draw call a una per materiale. `root` non deve avere un genitore.
 */
export function mergeByMaterial(root: Object3D): Group {
  root.updateMatrixWorld(true)
  const buckets = new Map<string, { material: Material; geos: BufferGeometry[] }>()

  root.traverseVisible((obj) => {
    if (!(obj instanceof Mesh) || Array.isArray(obj.material)) return
    const geo = (obj.geometry as BufferGeometry).clone()
    geo.applyMatrix4(obj.matrixWorld)
    geo.morphAttributes = {}
    const key = `${obj.material.uuid}|${geometryKey(geo)}`
    let bucket = buckets.get(key)
    if (!bucket) {
      bucket = { material: obj.material, geos: [] }
      buckets.set(key, bucket)
    }
    bucket.geos.push(geo)
  })

  const merged = new Group()
  for (const { material, geos } of buckets.values()) {
    const geometry = geos.length === 1 ? geos[0] : mergeGeometries(geos, false)
    if (!geometry) continue
    if (geos.length > 1) for (const g of geos) g.dispose()
    merged.add(new Mesh(geometry, material))
  }
  return merged
}

/**
 * Prepara un GLB una sola volta per scena sorgente (stesse geometrie e materiali per tutte
 * le istanze); ogni chiamata restituisce un clone leggero di `root`.
 */
export function memoPrepared<T extends { root: Object3D }>(prepare: (scene: Object3D) => T) {
  const cache = new WeakMap<Object3D, T>()
  return (scene: Object3D): T => {
    let prepared = cache.get(scene)
    if (!prepared) {
      prepared = prepare(scene)
      cache.set(scene, prepared)
    }
    return { ...prepared, root: prepared.root.clone() }
  }
}
