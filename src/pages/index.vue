<script setup>
import { downloadSvg } from '../utils/helper'

const { width, height } = useCanvas()
const $canvas = ref()

function onDownload() {
  if (!$canvas.value)
    return
  const svg = $canvas.value.getSvg({})
  downloadSvg(svg, 'svg-drawing.svg')
}
</script>

<template>
  <div full flex="~ col center" gap-2>
    <ResizePan v-model:width="width" v-model:height="height">
      <Card>
        <SvgCanvas
          ref="$canvas"
          :width="width"
          :height="height"
          background="white"
        />
      </Card>
    </ResizePan>
    <div flex="~ row " items-center justify-end>
      <button btn flex="~ items-center" gap-1 @click="onDownload">
        <div i-carbon:download />
        <span>Download</span>
      </button>
    </div>
  </div>
</template>
