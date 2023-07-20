<script setup>
import { computed, ref } from 'vue'
import { useElementBounding, useEventListener } from '@vueuse/core'

const $svg = ref(null)
const drawing = ref(false)
const rect = useElementBounding($svg)

const lines = ref([])
const paths = computed(() => lines.value.map(line => `M${line.map(p => p.join(',')).join('L')}`))

function onDraw(e) {
  if (!drawing.value)
    return
  const currentLine = lines.value[lines.value.length - 1]
  const prevPoint = currentLine[currentLine.length - 1]
  const point = [e.clientX - rect.left.value, e.clientY - rect.top.value]
  if (!prevPoint)
    currentLine.push(point)
  else if (Math.abs(prevPoint[0] - point[0]) > 1 || Math.abs(prevPoint[1] - point[1]) > 1)
    currentLine.push(point)
}
function onDrawStart(e) {
  drawing.value = true
  lines.value.push([])
  onDraw(e)
}
const onDrawEnd = _ => drawing.value = false
const distance = (p1, p2) => Math.hypot(p1[0] - p2[0], p1[1] - p2[1])
const lineLength = line => line.reduce((sum, point, index, arr) => sum + (index === 0 ? 0 : distance(arr[index - 1], point)), 0)

function download() {
  const speed = 500 // px/s

  const lengths = lines.value.map(line => lineLength(line))
  const totalLength = lengths.reduce((sum, length) => sum + length, 0)
  const totalDuration = totalLength / speed
  let pastPercent = 0
  const style = [
    '<style>',
    ...lines.value.map((line, i) => {
      const length = Number.parseInt(lengths[i])
      const percent = length / totalLength * 100
      const style = `path.line-${i} {
        stroke-dasharray: ${length} ${length + 5};
        stroke-dashoffset: ${length};
        animation: draw-${i} ${totalDuration}s linear forwards;
      }
      @keyframes draw-${i} {
        0% { stroke-dashoffset: ${length}; }
        ${pastPercent}% { stroke-dashoffset: ${length}; }
        ${pastPercent + percent}% { stroke-dashoffset: 0; }
        100% { stroke-dashoffset: 0; }
      }`
      pastPercent += percent
      return style
    }),
    '</style>',
  ].join('\n')
  const svg = `<svg width="800" height="800" xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink'>
    ${style}
    <rect x="0" y="0" width="800" height="800" fill="white" rx="20" />
    ${
      paths.value.map((d, i) => `<path class="line-${i}" d="${d}" stroke="black" stroke-width="5" fill="none" stroke-linejoin="round" stroke-linecap="round"  />`).join('\n')
    }  
  </svg>`
  const svgBase64 = `data:image/svg+xml;base64,${btoa(svg)}`
  const a = document.createElement('a')
  a.href = svgBase64
  a.download = 'drawing.svg'
  a.click()
}

useEventListener('mousemove', onDraw)
useEventListener('mouseup', onDrawEnd)
</script>

<template>
  <button @click="download">
    download
  </button>
  <div flex="~" h-full w-full items-center justify-center>
    <svg ref="$svg" width="800" height="800" view-box="0 0 800 800" @mousedown="onDrawStart">
      <rect x="0" y="0" width="800" height="800" fill="white" rx="20" />
      <path
        v-for="(p, i) in paths"
        :key="i" stroke-linecap="round" :d="p"
        stroke="black" stroke-width="5" fill="none"
        stroke-linejoin="round"
      />
    </svg>
  </div>
</template>
