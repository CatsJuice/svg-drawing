<script setup lang="ts">
import { Pane } from 'tweakpane'
import { download, svgCode2Url } from '../utils/helper'
import type { BrushOptions, DrawOptions, SvgReplayOptions } from '../types/svg'

const SvgCanvas = defineAsyncComponent(() => import('../components/SvgCanvas.vue'))

const { width, height } = useCanvas()
const svg = ref('')
const svgRef = ref()
const paneRef = ref<HTMLElement>()

const drawOptions: DrawOptions = reactive({
  background: '#fff',
  color: '#000',
  strokeWidth: 10,
})
const replayOptions: SvgReplayOptions = reactive({
  easing: 'ease',
  loop: true,
  speed: 500,
})
const brushOptions: BrushOptions = reactive({
  // to make sure that mask matches the path
  smoothing: 0,
  streamline: 0,

  thinning: 0.75,
  start: {
    cap: true,
    taper: 90,
  },
  end: {
    cap: true,
    taper: 90,
  },
})

const svgUrl = computed(() => svgCode2Url(svg.value))
const finalBrushOptions = computed(() => ({
  ...brushOptions,
  size: drawOptions.strokeWidth!,
}))

onMounted(() => {
  // if (!paneRef.value)
  //   return
  const pane = new Pane({ container: paneRef.value })
  const drawPane = pane.addFolder({ title: 'Draw Options', expanded: false })
  drawPane.addInput(drawOptions, 'background', { label: 'Background' })
  drawPane.addInput(drawOptions, 'color', { label: 'Color' })
  drawPane.addInput(drawOptions, 'strokeWidth', { label: 'Stroke Width', min: 1, max: 40 })

  const replayPane = pane.addFolder({ title: 'Replay Options', expanded: false })
  replayPane.addInput(replayOptions, 'easing', {
    label: 'Easing',
    options: {
      'ease': 'ease',
      'linear': 'linear',
      'ease-in': 'ease-in',
      'ease-out': 'ease-out',
      'ease-in-out': 'ease-in-out',
    },
  })
  replayPane.addInput(replayOptions, 'loop', { label: 'Loop' })
  replayPane.addInput(replayOptions, 'speed', { label: 'Speed', min: 50, max: 2000, step: 10 })

  const brushPane = pane.addFolder({ title: 'Brush Options', expanded: false })
  brushPane.addInput(brushOptions, 'thinning', { label: 'Thinning', min: 0, max: 1, step: 0.01 })
  brushPane.addInput(brushOptions.start!, 'taper', { label: 'Start Taper', min: 0, max: 100, step: 1 })
  brushPane.addInput(brushOptions.end!, 'taper', { label: 'End Taper', min: 0, max: 100, step: 1 })
})
</script>

<template>
  <div full flex="~ col center" gap-2>
    <teleport to="body">
      <div ref="paneRef" fixed left-2 top-2 w-280px />
    </teleport>
    <ResizePan v-model:width="width" v-model:height="height">
      <Card relative cursor-none>
        <ClientOnly>
          <SvgCanvas
            ref="svgRef"
            :draw-options="drawOptions"
            :replay-options="replayOptions"
            :brush-options="finalBrushOptions"
            :width="width"
            :height="height"
            @update="svg = $event"
          />
        </ClientOnly>
        <PenCursor class="!absolute" top-0 />
      </Card>
    </ResizePan>
    <img v-if="svg" :src="svgUrl" fixed bottom-10 right-10 w-200px border-1 rounded-2>
    <div flex="~ row " items-center justify-end gap2>
      <button
        :disabled="!svgRef?.canUndo"
        flex="~ center" px2 btn-outline @click="svgRef?.undo?.()"
      >
        <div i-carbon:undo />
      </button>

      <button
        :disabled="!svgRef?.canRedo"
        flex="~ center" px2 btn-outline @click="svgRef?.redo?.()"
      >
        <div i-carbon:redo />
      </button>

      <button :disabled="!svg" flex="~ center" gap-1 btn @click="download(svgUrl, 'svg-drawing.svg')">
        <div i-carbon:download />
        <span>Download</span>
      </button>

      <button :disabled="!svg" flex="~ center" gap-1 btn-outline @click="svgRef?.onClear?.()">
        <div i-carbon:trash-can />
        <span>Clear</span>
      </button>
    </div>
  </div>
</template>
