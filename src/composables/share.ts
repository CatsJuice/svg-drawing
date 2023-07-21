import type { BrushOptions, DrawOptions, Line, SvgReplayOptions } from '~/types/svg'

const shareKey = 'v'

interface SharedInfo {
  lines: Line[]
  options: {
    width: number
    height: number
    drawOptions: DrawOptions
    replayOptions: SvgReplayOptions
    brushOptions: BrushOptions
  }
}

export function createShareUrl(lines: SharedInfo['lines'], options: SharedInfo['options']) {
  const raw = JSON.stringify({ lines, options })
  const hashed = btoa(raw)
  return `${location.origin}?${shareKey}=${hashed}`
}

export function useShare() {
  const route = useRoute()
  function parseShareInfo() {
    const shareInfoRaw = route.query[shareKey] as string | undefined
    if (!shareInfoRaw)
      return null
    try {
      const raw = atob(shareInfoRaw)
      const { lines, options } = JSON.parse(raw)
      return { lines, options } as SharedInfo
    }
    catch (err) {
      return null
    }
  }
  return { parseShareInfo, createShareUrl }
}
