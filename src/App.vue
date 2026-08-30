<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";

import ConversionResults from "@/components/ConversionResults.vue";
import ConversionSizeTotals from "@/components/ConversionSizeTotals.vue";
import ConverterWorkspace from "@/components/ConverterWorkspace.vue";
import { useImageConverter } from "@/composables/use-image-converter";

const {
  quality,
  maxEdge,
  isProcessing,
  progress,
  progressLabel,
  results,
  largerCount,
  downloadableCount,
  canRecompress,
  sizeTotals,
  summaryText,
  setQuality,
  setMaxEdge,
  downloadLargerResults,
  downloadResult,
  downloadCompressedResults,
  downloadAllResults,
  processFiles,
  recompress,
} = useImageConverter();

const desktopBreakpoint = 1024;
const desktopReferenceHeight = 900;
let removeViewportResizeListener: (() => void) | undefined;

/** 页面随浏览器高度缩放的比例 */
const pageScale = ref(1);

onMounted(() => {
  const updatePageScale = () => {
    pageScale.value =
      window.innerWidth < desktopBreakpoint
        ? 1
        : Math.min(1, Math.max(window.innerHeight / desktopReferenceHeight, 0.1));
  };

  updatePageScale();
  window.addEventListener("resize", updatePageScale, { passive: true });
  removeViewportResizeListener = () => window.removeEventListener("resize", updatePageScale);
});

onBeforeUnmount(() => removeViewportResizeListener?.());
</script>

<template>
  <div class="app-viewport">
    <div class="app-shell" :style="{ zoom: pageScale }">
      <div class="app-header">
        <div class="brand">
          <img class="brand-mark" src="@/assets/img/logo.webp" alt="" />
          <div>
            <span class="brand-title">WebP 图片转换器</span>
            <span class="brand-subtitle">本地批量转换，图片不会上传到服务器</span>
          </div>
        </div>

        <a
          class="github-link"
          href="https://github.com/lengyibai/to-webp"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="查看 GitHub 仓库"
          title="查看 GitHub 仓库"
        >
          <img src="@/assets/img/github.png" alt="" />
        </a>
      </div>

      <div class="content-grid">
        <div class="primary-column">
          <ConverterWorkspace
            :quality="quality"
            :max-edge="maxEdge"
            :is-processing="isProcessing"
            @update:quality="setQuality"
            @update:max-edge="setMaxEdge"
            @files-selected="processFiles"
          />

          <ConversionSizeTotals :totals="sizeTotals" />
        </div>

        <div class="results-column">
          <ConversionResults
            class="results-panel"
            :results="results"
            :progress="progress"
            :progress-label="progressLabel"
            :larger-count="largerCount"
            :downloadable-count="downloadableCount"
            :total-count="sizeTotals.successCount"
            :can-recompress="canRecompress"
            :summary-text="summaryText"
            :is-processing="isProcessing"
            @download-larger="downloadLargerResults"
            @download-compressed="downloadCompressedResults"
            @download-all="downloadAllResults"
            @download-result="downloadResult"
            @recompress="recompress"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
.app-viewport {
  display: grid;
  align-items: center;
  min-height: 100vh;
  min-height: 100dvh;
}

.app-shell {
  width: calc(100% - 48px);
  max-width: 1460px;
  margin: 0 auto;
  padding: 24px 0;
}

.content-grid {
  display: grid;
  align-items: stretch;
  grid-template-columns: minmax(0, 0.92fr) minmax(0, 1.08fr);
  gap: 22px;
}

.primary-column {
  display: grid;
  min-width: 0;
  gap: 22px;
}

.results-column {
  position: relative;
  align-self: stretch;
  min-width: 0;
}

.results-panel {
  position: absolute;
  inset: 0;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
  gap: 26px;

  > .github-link {
    display: grid;
    place-items: center;
    flex: 0 0 50px;
    width: 50px;
    height: 50px;
    border: 1px solid @border;
    border-radius: @radius;
    background: @surface;
    transition:
      border-color 160ms ease,
      background-color 160ms ease,
      transform 160ms ease;

    > img {
      display: block;
      width: 32px;
      height: 32px;
    }

    &:hover {
      border-color: @border-strong;
      background: @surface-hover;
    }

    &:active {
      transform: scale(0.96);
    }

    &:focus-visible {
      outline: 2px solid @accent;
      outline-offset: 2px;
    }
  }
}

.brand {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 16px;

  .brand-title {
    display: block;
    color: @text;
    font-size: 25px;
    font-weight: 700;
    line-height: 1.25;
  }

  .brand-subtitle {
    display: block;
    margin-top: 4px;
    color: @text-muted;
    font-size: 15px;
  }
}

.brand-mark {
  display: block;
  flex: 0 0 48px;
  width: 48px;
  height: 48px;
  border-radius: @radius;
  object-fit: contain;
}

@media (max-width: 1023.98px) {
  .app-viewport {
    display: block;
    min-height: 0;
  }

  .content-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .results-column,
  .results-panel {
    position: static;
  }
}

@media (max-width: 767.98px) {
  .app-shell {
    width: calc(100% - 28px);
    padding: 20px 0;
  }

  .app-header {
    align-items: flex-start;
    flex-direction: column;
    gap: 14px;

    > .github-link {
      align-self: flex-end;
    }
  }

  .brand-title {
    font-size: 22px;
  }
}
</style>
