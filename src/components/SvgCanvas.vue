<script lang="ts" setup>
import type { Line, SvgReplayOptions } from '../types/svg'
import { lineLength, tab, tag } from '../utils/helper'

interface Position {
  x: number
  y: number
}
interface Props {
  width: number
  height: number
  background: string
  densities?: number
  options?: SvgReplayOptions
}
const props = withDefaults(defineProps<Props>(), {
  densities: 1,
})
const emits = defineEmits<{
  'update': [svg: string]
}>()

const $svg = ref<SVGElement>()
const drawing = ref(false)
const lines = ref<Line[]>([])

const rect = useElementBounding($svg)

const svgAttrs = computed(() => ({
  'width': props.width,
  'height': props.height,
  'viewBox': `0 0 ${props.width} ${props.height}`,
  'xmlns': 'http://www.w3.org/2000/svg',
  'xmlns:xlink': 'http://www.w3.org/1999/xlink',
}))
const bgRectAttrs = computed(() => ({
  x: 0,
  y: 0,
  width: props.width,
  height: props.height,
  fill: props.background,
}))

const paths = computed(() => lines.value.map(line => ({
  'd': `M${line.map(p => p.join(',')).join('L')}`,
  'stroke-width': '5',
  'stroke-linecap': 'round',
  'stroke-linejoin': 'round',
  'stroke': 'black',
  'fill': 'none',
} as any)))

const onMousedown = (e: MouseEvent) => onDrawStart({ x: e.clientX, y: e.clientY })
const onMousemove = (e: MouseEvent) => onDraw({ x: e.clientX, y: e.clientY })
const onMouseup = (e: MouseEvent) => onDrawEnd({ x: e.clientX, y: e.clientY })
const onTouchStart = (e: TouchEvent) => onDrawStart({ x: e.touches[0].clientX, y: e.touches[0].clientY })
const onTouchMove = (e: TouchEvent) => onDraw({ x: e.touches[0].clientX, y: e.touches[0].clientY })
const onTouchEnd = (e: TouchEvent) => onDrawEnd({ x: e.touches[0].clientX, y: e.touches[0].clientY })

function onDraw(pos: Position) {
  if (!drawing.value)
    return
  const currentLine = lines.value[lines.value.length - 1]
  const prevPoint = currentLine[currentLine.length - 1]
  const point = [pos.x - rect.left.value, pos.y - rect.top.value]
  if (!prevPoint)
    currentLine.push(point)
  else if (
    Math.abs(prevPoint[0] - point[0]) > props.densities
    || Math.abs(prevPoint[1] - point[1]) > props.densities
  )
    currentLine.push(point)
}
function onDrawStart(e: Position) {
  drawing.value = true
  lines.value.push([])
  onDraw(e)
}
function onDrawEnd(_: Position) {
  drawing.value = false
  emits('update', getSvg(props.options))
}

function getSvg(options: SvgReplayOptions = {}) {
  const {
    speed = 500,
    loop = false,
    easing = 'ease',
  } = options

  const lengths = lines.value.map(line => lineLength(line))
  const totalLength = lengths.reduce((sum, length) => sum + length, 0)
  const totalDuration = Number((totalLength / speed).toFixed(2))
  let lastPercent = 0

  const styles = lines.value.map((_, i) => {
    const length = Number(lengths[i].toFixed(0))
    const percent = length / totalLength * 100
    const newPercent = Number((lastPercent + percent).toFixed(2))
    const styleArr = [
      `path.line-${i} {`,
      tab(`stroke-dasharray: ${length} ${length + 5};`),
      tab(`stroke-dashoffset: ${length};`),
      tab(`animation: draw-${i} ${totalDuration}s ${easing} forwards ${loop ? 'infinite' : ''};`),
      '}',
      `@keyframes draw-${i} {`,
      tab(`0% { stroke-dashoffset: ${length}; }`),
      lastPercent === 0 ? null : tab(`${lastPercent}% { stroke-dashoffset: ${length}; }`),
      newPercent === 100 ? null : tab(`${newPercent}% { stroke-dashoffset: 0; }`),
      tab('100% { stroke-dashoffset: 0; }'),
      '}',
    ].filter(Boolean)
    lastPercent = newPercent
    return styleArr.join('\n')
  })
  const styleTag = `<style>\n${styles.join('\n')}\n</style>`

  return tag('svg', svgAttrs.value, [
    styleTag,
    tag('rect', bgRectAttrs.value),
    ...paths.value.map((p, i) => tag('path', {
      ...p,
      class: `line-${i}`,
    })),
  ])
}

useEventListener('mousemove', onMousemove)
useEventListener('mouseup', onMouseup)
useEventListener('touchmove', onTouchMove)
useEventListener('touchend', onTouchEnd)

defineExpose({
  getSvg,
})
</script>

<template>
  <div relative full>
    <svg ref="$svg" relative v-bind="svgAttrs" @mousedown="onMousedown" @touchstart="onTouchStart">
      <rect v-bind="bgRectAttrs" />
      <path v-for="(p, i) in paths" :key="i" v-bind="p" />
    </svg>
  </div>
</template>
