<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";

import MediaToolHeader from "@/components/MediaToolHeader/index.vue";
import CompressionQueue from "@/components/CompressionQueue/index.vue";
import VideoCompressorWorkspace from "@/components/VideoCompressorWorkspace/index.vue";
import { useVideoCompressor } from "@/composables/use-video-compressor";
import { usePageScale } from "@/composables/use-page-scale";
import { createCompressionPreview, resolvePreviewState } from "@/data/compression-preview";

const route = useRoute();
const previewSearch = typeof route.query.preview === "string" ? `?preview=${route.query.preview}` : "";
const previewState = resolvePreviewState(previewSearch, import.meta.env.DEV);
const preview = previewState ? createCompressionPreview(previewState) : null;
const compressor = useVideoCompressor({ enabled: !preview });

const { pageScale } = usePageScale();
const logoSrc = new URL("../../assets/img/video-logo.webp", import.meta.url).href;
const visibleResults = computed(() => preview?.results ?? compressor.results.value);
const visibleProgress = computed(() => preview?.progress ?? compressor.progress.value);
const visibleSummary = computed(() => preview?.summaryText ?? compressor.summaryText.value);
const visibleIsProcessing = computed(() => preview?.isProcessing ?? compressor.isProcessing.value);
const settingsLocked = computed(() => Boolean(preview) || compressor.settingsLocked.value);

</script>

<template>
  <div class="app-viewport">
    <div class="app-shell" :style="{ zoom: pageScale }">
      <MediaToolHeader
        :logo-src="logoSrc"
        title="视频压缩器"
        subtitle="视频仅在本地处理，不会上传到服务器"
        github-label="查看 GitHub 仓库"
      />

      <div class="content-grid">
        <div class="primary-column">
          <VideoCompressorWorkspace
            v-model:settings="compressor.settings.value"
            class="workspace-panel"
            :settings-locked="settingsLocked"
            :files-locked="Boolean(preview)"
            :compatibility-pending="preview ? false : compressor.compatibilityPending.value"
            :compatibility-error="preview ? '' : compressor.compatibilityError.value"
            @files-selected="compressor.addFiles"
          />
        </div>

        <div class="secondary-column">
          <CompressionQueue
            class="queue-panel"
            :results="visibleResults"
            :progress="visibleProgress"
            :summary-text="visibleSummary"
            :is-processing="visibleIsProcessing"
            @stop="compressor.stopTask"
            @start-task="compressor.startTask"
            @remove="compressor.removeTask"
            @recompress="compressor.recompressResult"
            @download="compressor.downloadResult"
            @download-all="compressor.downloadAll"
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
  align-self: stretch;
  min-width: 0;
}

.workspace-panel {
  height: auto;
  min-height: 0;
}

.secondary-column {
  position: relative;
  align-self: stretch;
  overflow: visible;
  min-width: 0;
  height: auto;
  min-height: 0;
}

.queue-panel {
  position: absolute;
  inset: 0;
  min-height: 0;
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

  .workspace-panel {
    height: auto;
  }

  .secondary-column {
    position: static;
    overflow: visible;
    height: auto;
    max-height: none;
  }

  .queue-panel {
    position: static;
    height: min(520px, calc(100vh - 28px));
    height: min(520px, calc(100dvh - 28px));
    min-height: 0;
  }
}

@media (max-width: 767.98px) {
  .app-shell {
    width: calc(100% - 28px);
    padding: var(--gap-5) 0;
  }

  .queue-panel {
    height: min(460px, calc(100vh - 28px));
    height: min(460px, calc(100dvh - 28px));
  }
}
</style>
