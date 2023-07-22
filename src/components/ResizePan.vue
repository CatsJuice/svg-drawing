<script lang="ts" setup>
interface Handle {
  id: string
  control: {
    direction: 'h' | 'v'
    reverse: boolean
  }[]
  style: any
  onPan?: (e: any) => void
}
interface Props {
  width: number
  height: number
}
const props = withDefaults(defineProps<Props>(), {})
const emits = defineEmits(['update:width', 'update:height'])

const sizeStyle = computed(() => ({
  width: `${props.width}px`,
  height: `${props.height}px`,
}))
const rw = 10
const bg = 'transparent'

const resizeHandlers: Handle[] = [
  {
    id: 'l',
    control: [{ direction: 'h', reverse: true }],
    style: {
      cursor: 'ew-resize',
      left: `${-rw / 2}px`,
      top: `${rw / 2}px`,
      height: `calc(100% - ${rw}px)`,
      width: `${rw}px`,
      background: bg,
    },
  },
  {
    id: 'r',
    control: [{ direction: 'h', reverse: false }],
    style: {
      cursor: 'ew-resize',
      right: `${-rw / 2}px`,
      top: `${rw / 2}px`,
      height: `calc(100% - ${rw}px)`,
      width: `${rw}px`,
      background: bg,
    },
  },
  {
    id: 't',
    control: [{ direction: 'v', reverse: true }],
    style: {
      cursor: 'ns-resize',
      top: `${-rw / 2}px`,
      left: `${rw / 2}px`,
      width: `calc(100% - ${rw}px)`,
      height: `${rw}px`,
      background: bg,
    },
  },
  {
    id: 'b',
    control: [{ direction: 'v', reverse: false }],
    style: {
      cursor: 'ns-resize',
      bottom: `${-rw / 2}px`,
      left: `${rw / 2}px`,
      width: `calc(100% - ${rw}px)`,
      height: `${rw}px`,
      background: bg,
    },
  },
  {
    id: 'tl',
    control: [
      { direction: 'v', reverse: true },
      { direction: 'h', reverse: true },
    ],
    style: {
      cursor: 'nwse-resize',
      top: `${-rw / 2}px`,
      left: `${-rw / 2}px`,
      width: `${rw}px`,
      height: `${rw}px`,
      background: bg,
    },
  },
  {
    id: 'tr',
    control: [
      { direction: 'v', reverse: true },
      { direction: 'h', reverse: false },
    ],
    style: {
      cursor: 'nesw-resize',
      top: `${-rw / 2}px`,
      right: `${-rw / 2}px`,
      width: `${rw}px`,
      height: `${rw}px`,
      background: bg,
    },
  },
  {
    id: 'bl',
    control: [
      { direction: 'v', reverse: false },
      { direction: 'h', reverse: true },
    ],
    style: {
      cursor: 'nesw-resize',
      bottom: `${-rw / 2}px`,
      left: `${-rw / 2}px`,
      width: `${rw}px`,
      height: `${rw}px`,
      background: bg,
    },
  },
  {
    id: 'br',
    control: [
      { direction: 'v', reverse: false },
      { direction: 'h', reverse: false },
    ],
    style: {
      cursor: 'nwse-resize',
      bottom: `${-rw / 2}px`,
      right: `${-rw / 2}px`,
      width: `${rw}px`,
      height: `${rw}px`,
      background: bg,
    },
  },
]
resizeHandlers.forEach(handle => handle.onPan = e => onPan(handle, e))

function onPan(handle: Handle, e: any) {
  const { delta } = e
  const { control } = handle
  let width = props.width
  let height = props.height
  control.forEach((ctl) => {
    if (ctl.direction === 'h')
      width += ((ctl.reverse ? -delta.x : delta.x) || 0) * 2
    else
      height += ((ctl.reverse ? -delta.y : delta.y) || 0) * 2
  })
  emits('update:width', width)
  emits('update:height', height)
}
</script>

<template>
  <div class="resize-pan" :style="sizeStyle" relative>
    <slot />
    <div
      v-for="handle in resizeHandlers" :key="handle.id"
      v-touch-pan.mouse="handle.onPan" absolute
      :style="handle.style"
    />
  </div>
</template>
