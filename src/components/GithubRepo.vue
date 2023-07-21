<script lang="ts" setup>
import { GITHUB_REPO } from '../constants/links'
</script>

<template>
  <a :href="GITHUB_REPO" target="_blank" rounded-2 p1 hover:bg="gray/10">
    <div i-fa6-brands:github class="github-repo" />
  </a>
</template>
