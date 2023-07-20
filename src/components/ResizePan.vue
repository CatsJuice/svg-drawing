<script lang="ts" setup>
interface Props {
  width: number
  height: number
}
const props = withDefaults(defineProps<Props>(), {})
defineEmits<{
  'update:width': [w: number]
  'update:height': [h: number]
}>()

const sizeStyle = computed(() => ({
  width: `${props.width}px`,
  height: `${props.height}px`,
}))
</script>

<template>
  <div class="resize-pan" :style="sizeStyle">
    <slot />
  </div>
</template>
