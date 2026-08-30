<script setup lang="ts">
import MediaToolHeader from "@/components/MediaToolHeader/index.vue";
import ConversionResults from "@/components/ConversionResults.vue";
import ConversionSizeTotals from "@/components/ConversionSizeTotals.vue";
import ConverterWorkspace from "@/components/ConverterWorkspace.vue";
import { useImageConverter } from "@/composables/use-image-converter";
import { usePageScale } from "@/composables/use-page-scale";

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

const { pageScale } = usePageScale();
const logoSrc = new URL("../../assets/img/webp-logo.webp", import.meta.url).href;
</script>

<template>
  <div class="app-viewport">
    <div class="app-shell" :style="{ zoom: pageScale }">
      <MediaToolHeader
        :logo-src="logoSrc"
        title="WebP 图片转换器"
        subtitle="本地批量转换，图片不会上传到服务器"
        github-label="查看 GitHub 仓库"
      />

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
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: var(--gap-5);
  min-height: 727.5px;
}

.primary-column {
  display: grid;
  min-width: 0;
  gap: var(--gap-5);
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

@media (max-width: 1023.98px) {
  .app-viewport {
    display: block;
    min-height: 0;
  }

  .content-grid {
    grid-template-columns: minmax(0, 1fr);
    min-height: 0;
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
}
</style>
