import { isClient } from '@vueuse/core'
import type { Point } from '~/types/svg'

export const distance = (p1: Point, p2: Point) => Math.hypot(p1[0] - p2[0], p1[1] - p2[1])
export function lineLength(line: Point[]) {
  return line.reduce(
    (acc, p, i) => acc + (i > 0 ? distance(p, line[i - 1]) : 0),
    0)
}

export function download(href: string, filename: string) {
  if (!isClient)
    return
  const a = document.createElement('a')
  a.href = href
  a.download = filename
  a.click()
}

export function downloadSvg(svgCode: string, filename: string) {
  download(svgCode2Url(svgCode), filename)
}

export function svgCode2Url(svgCode: string) {
  return `data:image/svg+xml;base64,${btoa(svgCode)}`
}

export function tag(tagName: string, props: Record<string, any>, children?: any[]) {
  return [
  `<${tagName} ${Object.entries(props).map(([k, v]) => `${k}="${v}"`).join(' ')}>`,
  `${children ? children.join('') : ''}`,
  `</${tagName}>`,
  ].join('\n')
}
export function tab(code: string) {
  return `  ${code}`
}
