<script setup>
import { download, svgCode2Url } from '../utils/helper'

const { width, height } = useCanvas()
const svg = ref('')
const svgRef = ref()

const svgUrl = computed(() => svgCode2Url(svg.value))

function onDownload() {
  download(svgUrl.value, 'svg-drawing.svg')
}

function onClear() {
  svgRef.value && svgRef.value.onClear()
  svg.value = ''
}
</script>

<template>
  <div full flex="~ col center" gap-2>
    <ResizePan v-model:width="width" v-model:height="height">
      <Card relative cursor-none>
        <SvgCanvas
          ref="svgRef"
          :width="width"
          :height="height"
          background="white"
          @update="svg = $event"
        />
        <PenCursor class="!absolute" top-0 />
      </Card>
    </ResizePan>
    <img v-if="svg" :src="svgUrl" fixed bottom-10 right-10 w-200px border-1 rounded-2>
    <div flex="~ row " items-center justify-end>
      <button :disabled="!svg" flex="~ items-center" gap-1 btn @click="onDownload">
        <div i-carbon:download />
        <span>Download</span>
      </button>

      <button :disabled="!svg" flex="~ items-center" gap-1 btn-ghost @click="onClear">
        <div i-carbon:trash-can />
        <span>Clear</span>
      </button>
    </div>
  </div>
</template>
