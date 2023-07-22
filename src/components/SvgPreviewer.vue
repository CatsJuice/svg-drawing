<script lang="ts" setup>
import { download, svgCode2Url } from '~/utils/helper'

interface Props {
  svgCode: string
}
withDefaults(defineProps<Props>(), {})

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
const isAnimating = ref(false)

const scale = computed(() => 200 / canvasWidth.value)
const previewSize = computed(() => ({
  width: 200,
  height: canvasHeight.value * scale.value,
}))
const positionStyle = computed(() => Object.entries(position.value).reduce((acc, [key, value]) => ({
  ...acc,
  [key]: `${value}px`,
}), {}))

function onPan(e: any) {
  if (isAnimating.value)
    return

  const { isFirst, isFinal, delta } = e
  if (isFirst) {
    const rect = $el.value!.getBoundingClientRect()
    position.value = {
      left: rect.left,
      top: rect.top,
    }
    return
  }

  if (isFinal) {
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
</script>

<template>
  <div
    ref="$el"
    v-touch-pan.prevent.mouse="onPan"
    class="svg-previewer"
    fixed z-10 w-200px cursor-move overflow-hidden border-1 rounded-4
    :style="{
      'width': `${previewSize.width}px`,
      'height': `${previewSize.height}px`,
      '--scale': scale,
      ...positionStyle,
      'transition': isAnimating ? 'all 0.3s' : 'none',
    }"
  >
    <div full v-html="svgCode" />
    <div
      class="operation" bg="dark/10"
      flex="~ col center"
      transition-backdrop-blur absolute left-0 top-0 full gap-2 text-sm
      opacity-0 backdrop-blur-0px transition-opacity hover:opacity-100 hover:backdrop-blur-8px
      hover:backdrop-saturate-180
    >
      <button w-20 preview-btn @mousedown.stop @touchstart.stop>
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
</template>

<style>
.svg-previewer svg {
  transform: scale(var(--scale, 1));
  transform-origin: 0 0;
}
</style>
