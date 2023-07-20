<script lang="ts" setup>

</script>

<template>
  <div class="card" full border-1 rounded-12px p-1px>
    <div full overflow-hidden rounded-11px bg-white>
      <slot />
    </div>
  </div>
</template>

<style scoped>
.card {
  background: linear-gradient(45deg, #EEEEEE 0%, #FCFCFC 100%);
}
</style>
