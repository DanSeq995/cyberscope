import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useMemo } from 'react'
import { Color, Mesh, MeshStandardMaterial, Object3D } from 'three'

import { prepareRackCabinet, SERVER_GLB } from './serverFit'

const ALARM_COLOR = new Color('#ef4444')
const ALARM_EMISSIVE = new Color('#7f1d1d')

function applyAlarm(root: Object3D, alarmed: boolean) {
  root.traverse((obj) => {
    if (!(obj instanceof Mesh)) return
    const materials = Array.isArray(obj.material) ? obj.material : [obj.material]
    for (const mat of materials) {
      const std = mat as MeshStandardMaterial
      if (!std.userData.serverOrig) {
        std.userData.serverOrig = {
          color: std.color.clone(),
          emissive: std.emissive?.clone?.() ?? new Color(0),
          emissiveIntensity: std.emissiveIntensity ?? 0,
        }
      }
      const orig = std.userData.serverOrig as {
        color: Color
        emissive: Color
        emissiveIntensity: number
      }
      if (alarmed) {
        std.color.copy(ALARM_COLOR)
        std.emissive.copy(ALARM_EMISSIVE)
        std.emissiveIntensity = 1
      } else {
        std.color.copy(orig.color)
        std.emissive.copy(orig.emissive)
        std.emissiveIntensity = orig.emissiveIntensity
      }
    }
  })
}

/** Armadio rack (GLB scalato a `RACK` in layout). */
export function RackCabinetModel({ alarmed = false }: { alarmed?: boolean }) {
  const { scene } = useGLTF(SERVER_GLB)
  const model = useMemo(() => prepareRackCabinet(scene), [scene])

  useLayoutEffect(() => {
    applyAlarm(model, alarmed)
  }, [model, alarmed])

  useFrame(({ clock }) => {
    if (!alarmed) return
    const pulse = 0.6 + 0.6 * Math.sin(clock.elapsedTime * 6)
    model.traverse((obj) => {
      if (!(obj instanceof Mesh)) return
      const materials = Array.isArray(obj.material) ? obj.material : [obj.material]
      for (const mat of materials) {
        const std = mat as MeshStandardMaterial
        if (std.userData.serverOrig) std.emissiveIntensity = pulse
      }
    })
  })

  return <primitive object={model} />
}

useGLTF.preload(SERVER_GLB)