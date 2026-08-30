<script setup lang="ts">
import { computed, ref } from "vue";
import { LuChevronDown, LuFileWarning, LuFolderOpen, LuUpload } from "vue-icons-plus/lu";

import type { VideoCompressionSettings } from "@/types/video-compressor";

interface Props {
  /** 是否锁定压缩设置 */
  settingsLocked: boolean;
  /** 是否锁定文件选择 */
  filesLocked: boolean;
  /** 是否正在检测浏览器能力 */
  compatibilityPending: boolean;
  /** 浏览器兼容性错误 */
  compatibilityError: string;
}
const $props = defineProps<Props>();
const $emit = defineEmits<{
  "files-selected": [files: File[]];
}>();
const settings = defineModel<VideoCompressionSettings>("settings", { required: true });

/** 原生文件选择控件 */
const fileInputRef = ref<HTMLInputElement>();
/** 是否正在拖入文件 */
const dragActive = ref(false);
const canSelectFiles = computed(
  () => !$props.filesLocked && !$props.compatibilityPending && !$props.compatibilityError,
);

const handleSelectClick = () => {
  if (canSelectFiles.value) fileInputRef.value?.click();
};

const handleFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const files = Array.from(input.files ?? []);
  if (files.length) $emit("files-selected", files);
  input.value = "";
};

const handleDragEnter = () => {
  if (canSelectFiles.value) dragActive.value = true;
};

const handleDragLeave = () => {
  dragActive.value = false;
};

const handleDrop = (event: DragEvent) => {
  dragActive.value = false;
  if (!canSelectFiles.value) return;

  const files = Array.from(event.dataTransfer?.files ?? []);
  if (files.length) $emit("files-selected", files);
};
</script>

<template>
  <div class="workspace" role="region" aria-labelledby="settings-title">
    <div class="settings-panel">
      <div class="settings-heading">
        <div>
          <span id="settings-title" class="title">输出设置</span>
          <span class="description">选择常用参数后添加视频</span>
        </div>
      </div>

      <div class="settings-grid">
        <label class="setting-control">
          <span class="setting-label">分辨率</span>
          <span class="select-field">
            <select v-model="settings.resolution" :disabled="settingsLocked" aria-label="输出分辨率">
              <option value="original">原始尺寸</option>
              <option value="1080p">1080p</option>
              <option value="720p">720p</option>
            </select>
            <LuChevronDown :size="17" aria-hidden="true" />
          </span>
        </label>

        <div class="quality-control">
          <span class="setting-label">压缩质量</span>
          <div class="quality-options" role="radiogroup" aria-label="压缩质量">
            <label>
              <input
                v-model="settings.quality"
                type="radio"
                name="compression-quality"
                value="medium"
                :disabled="settingsLocked"
              />
              <span>中</span>
            </label>
            <label>
              <input
                v-model="settings.quality"
                type="radio"
                name="compression-quality"
                value="high"
                :disabled="settingsLocked"
              />
              <span>高</span>
            </label>
          </div>
        </div>

        <div class="frame-rate-control">
          <span class="setting-label">输出帧率</span>
          <div class="frame-rate-options" role="radiogroup" aria-label="输出帧率">
            <label title="保留原视频帧率">
              <input
                v-model="settings.frameRate"
                type="radio"
                name="output-frame-rate"
                value="original"
                :disabled="settingsLocked"
              />
              <span>原始</span>
            </label>
            <label title="输出为每秒 30 帧">
              <input
                v-model="settings.frameRate"
                type="radio"
                name="output-frame-rate"
                value="30"
                :disabled="settingsLocked"
              />
              <span>30</span>
            </label>
            <label title="输出为每秒 60 帧">
              <input
                v-model="settings.frameRate"
                type="radio"
                name="output-frame-rate"
                value="60"
                :disabled="settingsLocked"
              />
              <span>60</span>
            </label>
          </div>
        </div>
      </div>
    </div>

    <div
      class="drop-zone"
      :class="{ 'is-busy': filesLocked || compatibilityPending, 'is-dragging': dragActive }"
      :aria-disabled="!canSelectFiles"
      @dragenter.prevent="handleDragEnter"
      @dragover.prevent
      @dragleave.prevent="handleDragLeave"
      @drop.prevent="handleDrop"
    >
      <input
        ref="fileInputRef"
        class="file-input"
        type="file"
        accept=".mp4,video/mp4"
        multiple
        :disabled="!canSelectFiles"
        @change="handleFileChange"
      />
      <span class="upload-symbol" aria-hidden="true">
        <LuUpload :size="34" />
      </span>
      <span class="drop-title">{{ compatibilityPending ? "正在检测浏览器能力" : "拖放视频到这里" }}</span>
      <span class="drop-subtitle">仅支持 MP4，可一次添加多个视频</span>
      <span v-if="compatibilityError" class="status-message is-error">
        <LuFileWarning :size="16" aria-hidden="true" />
        <span>{{ compatibilityError }}</span>
      </span>
      <button type="button" :disabled="!canSelectFiles" @click="handleSelectClick">
        <LuFolderOpen :size="18" aria-hidden="true" />
        <span>选择视频</span>
      </button>
    </div>
  </div>
</template>

<style scoped lang="less">
@import url("./index.less");
</style>
