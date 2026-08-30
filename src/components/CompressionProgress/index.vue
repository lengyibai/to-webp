<script setup lang="ts">
import type { CompressionProgress } from "@/types/video-compressor";

interface Props {
  /** 当前压缩进度 */
  progress: CompressionProgress;
}
defineProps<Props>();
</script>

<template>
  <div v-if="progress.phase !== 'idle'" class="progress-panel" :class="`is-${progress.phase}`">
    <div class="progress-copy">
      <span>{{ progress.label }}</span>
      <span>{{ progress.completed }} / {{ progress.total }}</span>
    </div>
    <div
      class="progress-track"
      role="progressbar"
      aria-label="视频压缩进度"
      aria-valuemin="0"
      aria-valuemax="100"
      :aria-valuenow="Math.round(progress.percent)"
    >
      <span :style="{ width: `${progress.percent}%` }"></span>
    </div>
    <span class="current-file" :title="progress.currentFile">{{ progress.currentFile }}</span>
  </div>
</template>

<style scoped lang="less">
@import url("./index.less");
</style>
