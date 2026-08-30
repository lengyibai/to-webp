<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useRoute } from "vue-router";

import CompressionQueue from "@/components/CompressionQueue/index.vue";
import ToolRouteSwitch from "@/components/ToolRouteSwitch/index.vue";
import VideoCompressorWorkspace from "@/components/VideoCompressorWorkspace/index.vue";
import { useVideoCompressor } from "@/composables/use-video-compressor";
import { createCompressionPreview, resolvePreviewState } from "@/data/compression-preview";

const route = useRoute();
const previewSearch = typeof route.query.preview === "string" ? `?preview=${route.query.preview}` : "";
const previewState = resolvePreviewState(previewSearch, import.meta.env.DEV);
const preview = previewState ? createCompressionPreview(previewState) : null;
const compressor = useVideoCompressor({ enabled: !preview });

const desktopBreakpoint = 1024;
const desktopReferenceHeight = 900;
let removeViewportResizeListener: (() => void) | undefined;

/** 页面随浏览器高度缩放的比例 */
const pageScale = ref(1);
const visibleResults = computed(() => preview?.results ?? compressor.results.value);
const visibleProgress = computed(() => preview?.progress ?? compressor.progress.value);
const visibleSummary = computed(() => preview?.summaryText ?? compressor.summaryText.value);
const visibleIsProcessing = computed(() => preview?.isProcessing ?? compressor.isProcessing.value);
const settingsLocked = computed(() => Boolean(preview) || compressor.settingsLocked.value);

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
          <img class="brand-mark" src="@/assets/img/video-logo.webp" alt="" />
          <div class="brand-copy">
            <span class="brand-title">视频压缩器</span>
            <span class="brand-subtitle">视频仅在本地处理，不会上传到服务器</span>
          </div>
        </div>

        <div class="header-actions">
          <ToolRouteSwitch />
          <a
            class="github-link"
            href="https://github.com/lengyibai/video-compression"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="查看 GitHub 仓库"
            title="查看 GitHub 仓库"
          >
            <img src="@/assets/img/github.png" alt="" />
          </a>
        </div>
      </div>

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
  padding: var(--gap-3) 0;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--gap-5);
  gap: var(--gap-6);

  > .brand {
    display: flex;
    align-items: center;
    min-width: 0;
    gap: var(--gap-4);

    > .brand-mark {
      display: block;
      flex: 0 0 48px;
      width: 48px;
      height: 48px;
      border-radius: var(--radius-3);
      object-fit: contain;
    }

    > .brand-copy {
      min-width: 0;

      > .brand-title {
        display: block;
        color: @text;
        font-size: 25px;
        font-weight: bold;
      }

      > .brand-subtitle {
        display: block;
        margin-top: var(--gap-1);
        color: @text-muted;
        font-size: 15px;
      }
    }
  }

  > .header-actions {
    display: flex;
    align-items: center;
    flex: 0 0 auto;
    gap: var(--gap-3);

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
}

.content-grid {
  display: grid;
  align-items: stretch;
  grid-template-columns: minmax(0, 0.94fr) minmax(0, 1.06fr);
  gap: var(--gap-5);
}

.primary-column {
  display: flex;
  align-self: stretch;
  min-width: 0;
}

.workspace-panel {
  flex: 1;
  height: 100%;
  min-height: 0;
}

.secondary-column {
  position: relative;
  align-self: stretch;
  overflow: hidden;
  min-width: 0;
  height: 700px;
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

  .app-header {
    align-items: flex-start;
    flex-direction: column;

    > .brand {
      gap: var(--gap-3);

      > .brand-copy {
        > .brand-title {
          font-size: 22px;
        }

        > .brand-subtitle {
          max-width: 220px;
          font-size: 14px;
        }
      }
    }

    > .header-actions {
      justify-content: space-between;
      width: 100%;
    }
  }

  .queue-panel {
    height: min(460px, calc(100vh - 28px));
    height: min(460px, calc(100dvh - 28px));
  }
}
</style>
