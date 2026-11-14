import { VIDEO_WALL } from '@/scene/office/layout'

/** Dimensioni in pixel CSS della dashboard SOC: 200 px per metro di video wall (800 × 360). */
const PX_PER_M = 200
export const DASHBOARD_WIDTH = Math.round(VIDEO_WALL.size[0] * PX_PER_M)
export const DASHBOARD_HEIGHT = Math.round(VIDEO_WALL.size[1] * PX_PER_M)
