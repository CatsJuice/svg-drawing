<script lang="ts" setup>
import { getStroke } from 'perfect-freehand'

// @ts-expect-error - no types
import Mousetrap from 'mousetrap'
import { lineLength, tab, tag } from '../utils/helper'
import type { BrushOptions, DrawOptions, Line, SvgReplayOptions } from '../types/svg'

interface Position {
  x: number
  y: number
}

interface Props {
  width: number
  height: number
  densities?: number

  drawOptions?: DrawOptions
  replayOptions?: SvgReplayOptions
  brushOptions?: BrushOptions
}
const props = withDefaults(defineProps<Props>(), {
  densities: 1,
})
const emits = defineEmits(['update'])

const $svg = ref<SVGElement>()
const drawing = ref(false)
const lines = ref<Line[]>([])
const { commit, undo: _undo, redo: _redo, canRedo, canUndo } = useManualRefHistory(lines, {
  capacity: 20,
  clone: (v: any) => JSON.parse(JSON.stringify(v)),
})

onMounted(() => {
  Mousetrap.bind(['command+z', 'ctrl+z'], undo)
  Mousetrap.bind(['command+shift+z', 'ctrl+shift+z'], redo)
})

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
  fill: props.drawOptions?.background ?? 'white',
}))
const paths = computed(() => lines.value.map(line => ({
  'd': line.length === 1
    ? `M${line[0].join(' ')}L${line[0].join(' ')}`
    : `M${line.map(p => p.join(',')).join('L')}`,
  'stroke-width': props.drawOptions?.strokeWidth ?? '5',
  'stroke-linecap': 'round',
  'stroke-linejoin': 'round',
  'stroke': props.drawOptions?.color ?? 'black',
  'fill': 'none',
} as any)))
const brushworkLines = computed(() => lines.value.map((line) => {
  const points = getStroke(line, props.brushOptions)
  const d = `M${points.map(p => p.join(',')).join('L')}Z`
  return { d }
}))

watch(() => props.replayOptions, submitSvg, { deep: true })

const onMousedown = (e: MouseEvent) => onDrawStart({ x: e.clientX, y: e.clientY })
const onMousemove = (e: MouseEvent) => onDraw({ x: e.clientX, y: e.clientY })
const onMouseup = (_: MouseEvent) => onDrawEnd()
const onTouchStart = (e: TouchEvent) => onDrawStart({ x: e.touches[0].clientX, y: e.touches[0].clientY })
const onTouchMove = (e: TouchEvent) => onDraw({ x: e.touches[0].clientX, y: e.touches[0].clientY })
const onTouchEnd = (_: TouchEvent) => onDrawEnd()

function undo() {
  _undo()
  submitSvg()
}
function redo() {
  _redo()
  submitSvg()
}

function onDraw(pos: Position) {
  if (!drawing.value)
    return
  const currentLine = lines.value[lines.value.length - 1]
  const prevPoint = currentLine[currentLine.length - 1]
  const point = [pos.x - rect.left.value, pos.y - rect.top.value]
  if (!prevPoint)
    currentLine.push(point)
  else if (
    Math.abs(prevPoint[0] - point[0]) >= props.densities
    || Math.abs(prevPoint[1] - point[1]) >= props.densities
  )
    currentLine.push(point)
  brushworkLine(currentLine)
}
function onDrawStart(e: Position) {
  drawing.value = true
  lines.value.push([])
  onDraw(e)
}
function onDrawEnd() {
  if (!drawing.value)
    return
  drawing.value = false
  submitSvg()
  commit()
}
function submitSvg() {
  emits('update', getSvg(props.replayOptions))
}
function onClear() {
  lines.value.splice(0)
  submitSvg()
  commit()
}
function getSvg(options: SvgReplayOptions = {}) {
  if (!paths.value.length)
    return ''
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

  return tag('svg', {
    ...(svgAttrs.value || {}),
    'data-cache': Date.now(),
  }, [
    styleTag,
    tag('rect', bgRectAttrs.value),
    tag('g', { mask: 'url(#brush)' }, paths.value.map((p, i) => tag('path', {
      ...p,
      class: `line-${i}`,
    }))),
    tag('mask', { id: 'brush' }, [
      tag('rect', { x: 0, y: 0, width: '100%', height: '100%', fill: 'black' }),
      ...brushworkLines.value.map(p => tag('path', {
        ...p,
        fill: 'white',
      })),
    ]),
  ])
}
function brushworkLine(line: Line) {
  return getStroke(line)
}

useEventListener('mousemove', onMousemove)
useEventListener('mouseup', onMouseup)
useEventListener('touchmove', onTouchMove)
useEventListener('touchend', onTouchEnd)

defineExpose({
  getSvg,
  onClear,
  undo,
  redo,
  canRedo,
  canUndo,
})
</script>

<template>
  <div relative full>
    <svg ref="$svg" relative v-bind="svgAttrs" @mousedown="onMousedown" @touchstart="onTouchStart">
      <rect v-bind="bgRectAttrs" />
      <g mask="url(#brush)">
        <path v-for="(p, i) in paths" :key="i" v-bind="p" />
      </g>
      <mask id="brush">
        <rect x="0" y="0" width="100%" height="100%" fill="black" />
        <path v-for="(p, i) in brushworkLines" :key="i" fill="white" v-bind="p" />
      </mask>
    </svg>
  </div>
</template>
