<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from "vue";
import { LuAlertTriangle, LuArrowRight, LuCheck, LuImage } from "vue-icons-plus/lu";

import ConversionProgressPanel from "./ConversionProgress.vue";

import type { ConversionProgress, ConversionResult, ConversionSuccess } from "@/types/converter";
import { formatFileSize } from "@/utils/files";

const props = defineProps<{
  results: ConversionResult[];
  progress: ConversionProgress;
  progressLabel: string;
  summaryText: string;
  isProcessing: boolean;
  largerCount: number;
  downloadableCount: number;
  totalCount: number;
  canRecompress: boolean;
}>();

const emit = defineEmits<{
  "download-larger": [];
  "download-compressed": [];
  "download-all": [];
  "download-result": [result: ConversionSuccess];
  recompress: [];
}>();

/** 每条成功记录的缩略图临时地址 */
const thumbnailUrls = ref<Record<number, string>>({});
const canDownloadAll = computed(
  () => !props.isProcessing && Boolean(props.largerCount) && Boolean(props.downloadableCount),
);

watch(
  () => props.results,
  (results) => {
    const activeIds = new Set(results.filter((result) => result.state === "success").map((result) => result.id));
    const nextUrls = { ...thumbnailUrls.value };

    for (const result of results) {
      if (result.state === "success" && !nextUrls[result.id]) {
        nextUrls[result.id] = URL.createObjectURL(result.blob);
      }
    }

    for (const [resultId, objectUrl] of Object.entries(nextUrls)) {
      if (activeIds.has(Number(resultId))) continue;
      URL.revokeObjectURL(objectUrl);
      delete nextUrls[Number(resultId)];
    }

    thumbnailUrls.value = nextUrls;
  },
  { immediate: true },
);

const handleDownloadLarger = (): void => {
  if (!props.isProcessing && props.largerCount) emit("download-larger");
};

const handleDownloadResult = (result: ConversionResult): void => {
  if (props.isProcessing || result.state !== "success") return;
  emit("download-result", result);
};

const handleDownloadCompressed = (): void => {
  if (!props.isProcessing && props.downloadableCount) emit("download-compressed");
};

const handleDownloadAll = (): void => {
  if (canDownloadAll.value) emit("download-all");
};

const handleRecompress = (): void => {
  if (props.canRecompress) emit("recompress");
};

onUnmounted(() => {
  for (const objectUrl of Object.values(thumbnailUrls.value)) URL.revokeObjectURL(objectUrl);
});
</script>

<template>
  <div class="results" role="region" aria-labelledby="results-title">
    <div class="section-heading">
      <div>
        <span id="results-title" class="section-title">转换记录</span>
        <span v-if="summaryText" class="section-description">{{ summaryText }}</span>
      </div>
      <div class="heading-actions">
        <button
          class="heading-button recompress-button"
          type="button"
          :disabled="!canRecompress"
          @click="handleRecompress"
        >
          重新压缩
        </button>
        <button
          class="heading-button bulk-download-button"
          type="button"
          :disabled="isProcessing || !largerCount"
          @click="handleDownloadLarger"
        >
          下载增大项({{ largerCount }}/{{ totalCount }})
        </button>
        <button
          class="heading-button compressed-download-button"
          type="button"
          :disabled="isProcessing || !downloadableCount"
          @click="handleDownloadCompressed"
        >
          下载已压缩({{ downloadableCount }}/{{ totalCount }})
        </button>
        <button
          v-if="canDownloadAll"
          class="heading-button all-download-button"
          type="button"
          @click="handleDownloadAll"
        >
          下载所有图片({{ totalCount }})
        </button>
      </div>
    </div>

    <div v-if="!results.length" class="empty-state">
      <LuImage class-name="empty-graphic" :size="48" aria-hidden="true" />
      <span class="empty-title">还没有转换记录</span>
      <span>单张下载 WebP · 多张打包 ZIP</span>
    </div>

    <TransitionGroup v-else name="result" tag="div" class="result-list" aria-live="polite">
      <div
        v-for="result in results"
        :key="result.id"
        class="result-item"
        :class="{
          'is-error': result.state === 'error',
          'is-larger': result.state === 'success' && result.isLarger,
        }"
      >
        <span class="result-icon" aria-hidden="true">
          <LuCheck v-if="result.state === 'success'" :size="17" />
          <LuAlertTriangle v-else :size="17" />
        </span>
        <span class="result-thumbnail" :class="{ 'is-empty': result.state !== 'success' }" aria-hidden="true">
          <img v-if="result.state === 'success'" :src="thumbnailUrls[result.id]" alt="" />
        </span>
        <div class="result-main">
          <template v-if="result.state === 'success'">
            <span class="result-name" :title="result.sourceName">{{ result.outputName }}</span>
            <span class="result-detail conversion-detail">
              <span class="dimension-value">{{ result.originalWidth }} × {{ result.originalHeight }}</span>
              <span
                v-if="result.originalWidth !== result.width || result.originalHeight !== result.height"
                class="dimension-conversion"
              >
                <LuArrowRight class-name="detail-arrow" :size="15" aria-hidden="true" />
                <span class="dimension-value">{{ result.width }} × {{ result.height }}</span>
              </span>
              <span class="detail-separator" aria-hidden="true">|</span>
              <span class="size-detail">
                <span>{{ formatFileSize(result.originalSize) }}</span>
                <LuArrowRight class-name="detail-arrow" :size="15" aria-hidden="true" />
                <span>{{ formatFileSize(result.convertedSize) }}</span>
              </span>
            </span>
          </template>
          <template v-else>
            <span class="result-name">{{ result.sourceName }}</span>
            <span class="result-detail">{{ result.errorMessage }}</span>
          </template>
        </div>
        <div class="result-actions">
          <span class="result-saving">
            <template v-if="result.state === 'success'">
              <span class="change-value">{{ result.sizeChangeValue }}</span>
              <span class="change-percentage">{{ result.sizeChangePercentage }}</span>
            </template>
            <span v-else>失败</span>
          </span>
          <button
            v-if="result.state === 'success'"
            class="item-action-button item-download-button"
            type="button"
            :disabled="isProcessing"
            :aria-label="`下载 ${result.outputName}`"
            :title="`下载 ${result.outputName}`"
            @click="handleDownloadResult(result)"
          >
            下载
          </button>
        </div>
      </div>
    </TransitionGroup>

    <ConversionProgressPanel class="results-progress" :progress="progress" :label="progressLabel" />
  </div>
</template>

<style scoped lang="less">
.results {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
  border: 1px solid @border;
  border-radius: @radius;
  box-shadow: 0 16px 48px fade(#000, 22%);
  background: @surface;
}

.section-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex: 0 0 auto;
  flex-wrap: wrap;
  min-height: 84px;
  padding: 16px 20px;
  border-bottom: 1px solid @border;
  gap: 14px;

  > div {
    min-width: 0;
  }
}

.section-title {
  display: block;
  color: @text;
  font-size: 17px;
  font-weight: 700;
}

.section-description {
  display: block;
  margin-top: 3px;
  color: @text-muted;
  font-size: 14px;
}

.heading-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  max-width: 100%;
  margin-left: auto;
  gap: 10px;
}

.heading-button {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  flex: 0 0 auto;
  min-height: 42px;
  padding: 0 13px;
  border: 1px solid @border;
  border-radius: 5px;
  color: @text-dim;
  font-size: 14px;
  font-weight: bold;
  white-space: nowrap;
  cursor: pointer;
  background: fade(@text-muted, 5%);

  &:disabled {
    border-color: @border;
    color: @text-dim;
    cursor: not-allowed;
    background: fade(@text-muted, 5%);
  }
}

.recompress-button {
  border-color: fade(@info, 40%);
  color: @info;
  background: fade(@info, 9%);

  &:hover:not(:disabled),
  &:focus-visible:not(:disabled) {
    border-color: @info;
    background: fade(@info, 15%);
  }
}

.compressed-download-button {
  border-color: fade(@accent, 35%);
  color: @accent;
  background: fade(@accent, 8%);

  &:hover:not(:disabled),
  &:focus-visible:not(:disabled) {
    border-color: @accent;
    background: fade(@accent, 14%);
  }
}

.all-download-button {
  border-color: fade(@info, 40%);
  color: @info;
  background: fade(@info, 9%);

  &:hover:not(:disabled),
  &:focus-visible:not(:disabled) {
    border-color: @info;
    background: fade(@info, 15%);
  }
}

.bulk-download-button {
  border-color: fade(@warning, 35%);
  color: @warning;
  background: fade(@warning, 8%);

  &:hover:not(:disabled),
  &:focus-visible:not(:disabled) {
    border-color: @warning;
    background: fade(@warning, 14%);
  }
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 210px;
  padding: 34px;
  color: @text-muted;
  text-align: center;

  .empty-title {
    display: block;
    margin-top: 12px;
    color: @text;
    font-size: 17px;
    font-weight: 700;
  }

  > span:last-child {
    margin-top: 3px;
    font-size: 14px;
  }
}

.empty-graphic {
  color: @text-dim;
}

.result-list {
  flex: 1 1 auto;
  overflow-y: auto;
  min-height: 0;
  list-style: none;
  overscroll-behavior: contain;
  scrollbar-gutter: stable;
}

.results-progress {
  flex: 0 0 auto;
  min-width: 0;
}

.result-item {
  display: grid;
  align-items: center;
  grid-template-columns: 34px auto minmax(0, 1fr) auto;
  min-height: 80px;
  padding: 15px 20px;
  border-bottom: 1px solid @border;
  gap: 14px;

  &:last-child {
    border-bottom: 0;
  }
}

.result-icon {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  color: @accent;
  font-size: 16px;
  font-weight: 800;
  background: @accent-soft;
}

.result-thumbnail {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  height: 48px;
  border: 1px solid @border;
  border-radius: 5px;
  background: @bg;

  > img {
    display: block;
    width: auto;
    height: 100%;
  }

  &.is-empty {
    width: 48px;
    border-color: transparent;
    background: transparent;
  }
}

.result-main {
  min-width: 0;
}

.result-name {
  display: block;
  overflow: hidden;
  color: @text;
  font-size: 15px;
  font-weight: 650;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.result-detail {
  display: flex;
  align-items: center;
  margin-top: 4px;
  gap: 4px;
  color: @text-muted;
  font-size: 14px;
  white-space: nowrap;

  .detail-arrow {
    flex: 0 0 auto;
  }
}

.conversion-detail {
  flex-wrap: wrap;
  white-space: normal;

  .size-detail,
  .dimension-value,
  .dimension-conversion {
    white-space: nowrap;
  }

  .size-detail,
  .dimension-conversion {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  .detail-separator {
    color: @text-dim;
  }
}

.result-saving {
  display: grid;
  gap: 3px;
  justify-items: end;
  color: @text-muted;
  font-size: 14px;
  white-space: nowrap;
}

.result-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.item-action-button {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  flex: 0 0 auto;
  min-width: 58px;
  min-height: 42px;
  padding: 0 12px;
  border: 1px solid fade(@accent, 40%);
  border-radius: 5px;
  color: @accent;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  background: fade(@accent, 7%);

  &:hover:not(:disabled),
  &:focus-visible:not(:disabled) {
    border-color: @accent;
    background: fade(@accent, 14%);
  }

  &:disabled {
    border-color: @border;
    color: @text-dim;
    cursor: not-allowed;
    background: fade(@text-muted, 5%);
  }
}

.change-value,
.change-percentage {
  color: @accent;
  font-weight: 650;
  font-variant-numeric: tabular-nums;
}

.is-larger {
  .change-value,
  .change-percentage {
    color: @warning;
  }

  .item-download-button {
    border-color: fade(@warning, 45%);
    color: @warning;
    background: fade(@warning, 7%);

    &:hover:not(:disabled),
    &:focus-visible:not(:disabled) {
      border-color: @warning;
      background: fade(@warning, 14%);
    }
  }
}

.is-error {
  box-shadow: inset 2px 0 @danger;
  background: fade(@danger, 4%);

  .result-icon {
    color: @danger;
    background: fade(@danger, 12%);
  }

  .result-detail {
    color: fade(@danger, 82%);
  }

  .result-saving {
    color: @danger;
  }
}

.result-enter-active,
.result-leave-active {
  transition:
    opacity 160ms ease,
    transform 160ms ease;
}

.result-enter-from,
.result-leave-to {
  transform: translateY(-4px);
  opacity: 0;
}

@media (max-width: 767.98px) {
  .section-heading {
    align-items: flex-start;
  }

  .heading-actions {
    width: 100%;
    margin-left: 0;
  }

  .result-item {
    grid-template-columns: 34px auto minmax(0, 1fr);
  }

  .result-actions {
    grid-column: 3;
    justify-content: flex-start;
  }
}
</style>
