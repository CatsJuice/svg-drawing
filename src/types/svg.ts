import type getStroke from 'perfect-freehand'

export type Point = number[]
export type Line = Point[]

export interface SvgReplayOptions {
  speed?: number
  loop?: boolean
  easing?: string
  wipe?: number
  loopInterval?: number
}

export interface DrawOptions {
  color?: string
  background?: string
  strokeWidth?: number
}

export type BrushOptions = Parameters<typeof getStroke>[1]
