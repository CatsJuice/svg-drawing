<script lang="ts" setup>
// @ts-expect-error - no types
import Mousetrap from 'mousetrap'
import { download, svgCode2Url } from '~/utils/helper'

interface Props {
  svgCode: string
  openOnMount?: boolean
}
const props = withDefaults(defineProps<Props>(), {})

const minGap = 20
const $el = ref<HTMLElement>()
const position = ref<{
  left?: number
  top?: number
  right?: number
  bottom?: number
}>({
  left: minGap,
  bottom: minGap,
})
const hovered = ref(false)
const isAnimating = ref(false)
const isPreviewing = ref(false)
const previewScale = ref(1)
const isDragging = ref(false)

onMounted(() => {
  Mousetrap.bind(['space'], () => {
    if (isPreviewing.value)
      closePreview()
    else if (hovered.value)
      preview()
  })

  if (props.openOnMount)
    preview()
})

useEventListener('resize', () => {
  if (isPreviewing.value)
    preview()
})

const scale = computed(() => isPreviewing.value ? previewScale.value : 200 / canvasWidth.value)
const previewSize = computed(() => isPreviewing.value
  ? ({
      width: canvasWidth.value * previewScale.value,
      height: canvasHeight.value * previewScale.value,
    })
  : ({
      width: 200,
      height: canvasHeight.value * scale.value,
    }))
const positionStyle = computed(() => Object.entries(position.value).reduce((acc, [key, value]) => ({
  ...acc,
  [key]: `${value}px`,
}), {}))

function onPan(e: any) {
  if (isAnimating.value || isPreviewing.value)
    return

  const { isFirst, isFinal, delta } = e

  if (isFirst) {
    isDragging.value = true
    const rect = $el.value!.getBoundingClientRect()
    position.value = {
      left: rect.left,
      top: rect.top,
    }
    return
  }

  if (isFinal) {
    isDragging.value = false
    const rect = $el.value!.getBoundingClientRect()
    const { innerWidth, innerHeight } = window
    const { left, top } = position.value
    const rectCenterX = rect.left + rect.width / 2
    const leftOrRight = rectCenterX < innerWidth / 2 ? 'left' : 'right'
    const topOrBottom = rect.top < innerHeight / 2 ? 'top' : 'bottom'
    const x = minGap
    const y = topOrBottom === 'top'
      ? Math.max(minGap, position.value.top!)
      : Math.max(minGap, innerHeight - rect.height - position.value.top!)
    position.value = {
      [leftOrRight]: leftOrRight === 'left' ? left! : innerWidth - rect.width - left!,
      [topOrBottom]: topOrBottom === 'top' ? top! : innerHeight - rect.height - top!,
    }

    setTimeout(() => {
      isAnimating.value = true
      position.value = {
        [leftOrRight]: x,
        [topOrBottom]: y,
      }
      setTimeout(() => {
        isAnimating.value = false
      }, 300)
    }, 50)
    return
  }

  position.value = {
    left: position.value.left! + delta.x,
    top: position.value.top! + delta.y,
  }
}

let _positionToRecover: any = null

function preview() {
  isAnimating.value = true
  isPreviewing.value = true

  const { innerWidth, innerHeight } = window
  const safeWidth = innerWidth - minGap * 2
  const safeHeight = innerHeight - minGap * 2
  previewScale.value = Math.min(
    1,
    Math.min(
      safeWidth / canvasWidth.value,
      safeHeight / canvasHeight.value,
    ),
  )

  _positionToRecover = { ...position.value }
  // calc position
  const { width, height } = previewSize.value
  if ('left' in position.value)
    position.value.left = (innerWidth - width) / 2
  else if ('right' in position.value)
    position.value.right = (innerWidth - width) / 2
  if ('top' in position.value)
    position.value.top = (innerHeight - height) / 2
  else if ('bottom' in position.value)
    position.value.bottom = (innerHeight - height) / 2

  setTimeout(() => {
    isAnimating.value = false
  }, 300)
}
function closePreview() {
  isPreviewing.value = false
  isAnimating.value = true
  if (_positionToRecover)
    position.value = _positionToRecover
  setTimeout(() => {
    isAnimating.value = false
  }, 300)
}
</script>

<template>
  <teleport to="body">
    <div
      bg="dark/10" fixed inset-0 z-9 transition-all
      :class="isPreviewing
        ? ['opacity-100', 'backdrop-blur-3px']
        : ['opacity-0', 'pointer-events-none', 'backdrop-blur-0px']"
      @click="closePreview"
    />
    <div
      ref="$el"
      v-touch-pan.prevent.mouse="onPan"
      class="svg-previewer"
      fixed
      z-10
      w-200px overflow-hidden border-1 rounded-4
      :class="isPreviewing ? [] : [isDragging ? 'cursor-grabbing' : 'cursor-grab']"
      :style="{
        'width': `${previewSize.width}px`,
        'height': `${previewSize.height}px`,
        '--scale': scale,
        ...positionStyle,
        'transition': isAnimating ? 'all 0.3s' : 'none',
      }"
      @mouseenter="hovered = true"
      @mouseleave="hovered = false"
    >
      <div style="transition: inherit" full v-html="svgCode" />
      <div
        v-if="!isPreviewing"
        class="operation" bg="dark/10"
        flex="~ col center"
        transition-backdrop-blur absolute left-0 top-0 full gap-2 text-sm
        opacity-0 backdrop-blur-0px transition-opacity hover:opacity-100 hover:backdrop-blur-8px
        hover:backdrop-saturate-180
      >
        <button
          w-20 preview-btn @mousedown.stop @touchstart.stop
          @click="preview"
        >
          Preview
        </button>

        <button
          w-20 preview-btn
          @touchstart.stop @mousedown.stop
          @click.stop="download(svgCode2Url(svgCode), 'svg-drawing.svg')"
        >
          Save
        </button>
      </div>
    </div>
  </teleport>
</template>

<style>
.svg-previewer svg {
  transform: scale(var(--scale, 1));
  transform-origin: 0 0;
  transition: inherit;
}
</style>
