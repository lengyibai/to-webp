<script setup lang="ts">
import type { ConversionProgress } from "@/types/converter";

defineProps<{
  progress: ConversionProgress;
  label: string;
}>();
</script>

<template>
  <div v-if="progress.phase !== 'idle'" class="progress-panel">
    <div class="progress-copy">
      <span>{{ label }}</span>
      <span>{{ progress.completed }} / {{ progress.total }}</span>
    </div>
    <div
      class="progress-track"
      role="progressbar"
      aria-label="转换进度"
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
.progress-panel {
  padding: 18px 20px 20px;
  border-top: 1px solid @border;
}

.progress-copy {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  color: @text;
  font-size: 15px;

  span:last-child {
    color: @text-muted;
    font-variant-numeric: tabular-nums;
  }
}

.progress-track {
  overflow: hidden;
  height: 7px;
  border-radius: 3px;
  background: @bg;

  span {
    display: block;
    width: 0;
    height: 100%;
    border-radius: inherit;
    background: @accent;
    transition: width 180ms ease;
  }
}

.current-file {
  display: block;
  overflow: hidden;
  margin-top: 9px;
  color: @text-dim;
  font-size: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
