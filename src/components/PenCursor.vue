<script lang="ts" setup>
const $el = ref<HTMLElement>()
const { elementX, elementY, isOutside } = useMouseInElement($el)
const down = ref(false)

useEventListener('mousedown', () => down.value = true)
useEventListener('mouseup', () => down.value = false)

const cursorStyle = computed(() => ({
  left: `${elementX.value}px`,
  top: `${elementY.value}px`,
  opacity: isOutside.value ? 0 : 1,
}))
</script>

<template>
  <div ref="$el" pointer-events-none relative full>
    <div
      translate-y="-100%"
      :style="cursorStyle"
      i-solar:pen-bold-duotone absolute origin-bottom-left text-black
      :class="{ 'scale-85': down }"
      transition-transform
    />
  </div>
</template>
