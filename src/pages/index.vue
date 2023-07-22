<script setup lang="ts">
import { merge } from 'lodash-es'
import { Pane } from 'tweakpane'
import { download, svgCode2Url } from '../utils/helper'
import type { BrushOptions, DrawOptions, SvgReplayOptions } from '../types/svg'
import { createToast } from '../utils/toast'

const SvgCanvas = defineAsyncComponent(() => import('../components/SvgCanvas.vue'))

const { createShareUrl, parseShareInfo } = useShare()
const { copy } = useClipboard()
const { width, height } = useCanvas()
const svg = ref('')
const svgRef = ref()
const paneRef = ref<HTMLElement>()

const shared = parseShareInfo()
const initialLines = shared?.lines || []
const initialDrawOptions = shared?.options?.drawOptions || {}
const initialReplayOptions = shared?.options?.replayOptions || {}
const initialBrushOptions = shared?.options?.brushOptions || {}
if (shared?.options.width)
  width.value = shared.options.width
if (shared?.options.height)
  height.value = shared.options.height

const drawOptions: DrawOptions = reactive({
  background: '#fff',
  color: '#000',
  strokeWidth: 10,
  ...initialDrawOptions,
})
const replayOptions: SvgReplayOptions = reactive({
  easing: 'ease',
  loop: true,
  speed: 500,
  ...initialReplayOptions,
})
const brushOptions: BrushOptions = reactive(merge({
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
}, initialBrushOptions))

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
  brushPane.addInput(brushOptions!, 'thinning', { label: 'Thinning', min: 0, max: 1, step: 0.01 })
  brushPane.addInput(brushOptions!.start!, 'taper', { label: 'Start Taper', min: 0, max: 100, step: 1 })
  brushPane.addInput(brushOptions!.end!, 'taper', { label: 'End Taper', min: 0, max: 100, step: 1 })
})

function onShare(e: MouseEvent) {
  const url = createShareUrl(svgRef.value?.lines, { drawOptions, replayOptions, brushOptions, width: width.value, height: height.value })
  copy(url)
  const target = e.target as HTMLElement
  createToast(target, 'Share link copied!')
}
</script>

<template>
  <div full flex="~ col center" gap-2>
    <teleport to="body">
      <div ref="paneRef" fixed left-2 top-2 z-100 w-280px />
    </teleport>
    <ResizePan v-model:width="width" v-model:height="height">
      <Card relative cursor-none>
        <ClientOnly>
          <SvgCanvas
            ref="svgRef"
            :initial-lines="initialLines"
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
    <SvgPreviewer
      v-if="svg"
      :svg-code="svg"
    />

    <Teleport to="body">
      <div
        fixed
        left="1/2"
        translate-x="-1/2"
        bottom-20px
        class="toolbar"
        flex="~ row" w="9/10"
        max-w-500px items-center justify-between gap2 rounded-4 p2
      >
        <div flex="~" items-center gap2>
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
          <button :disabled="!svg" flex="~ center" gap-1 px2 text-sm btn-outline sm:px4 @click="svgRef?.onClear?.()">
            <div i-carbon:trash-can />
            <span display-none sm:display-inline>Clear</span>
          </button>
        </div>

        <div flex="~" items-center gap-2>
          <button
            :disabled="!svg" flex="~ center" gap-1 px2 btn-outline
            @click="onShare"
          >
            <div i-carbon:share pointer-events-none />
          </button>

          <button :disabled="!svg" flex="~ center" gap-1 btn @click="download(svgUrl, 'svg-drawing.svg')">
            <div i-carbon:download />
            <span xs:display-none display-inline>Save</span>
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style lang="scss">
.toolbar {
  background: linear-gradient(90deg, #ffffff00 0%, #fcfcfc00 100%);
  backdrop-filter:  blur(3px);
  position: relative;
  &::after {
    content: "";
    position: absolute;
    inset: 0;
    background: radial-gradient(180px circle,rgba(80,80,80,0.25), rgba(0,0,0,0.1));
    border-radius: inherit;

    -webkit-mask: linear-gradient(#000,#000) content-box content-box,linear-gradient(#000,#000);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    padding: 1px;
    pointer-events: none;
  }
}
</style>
