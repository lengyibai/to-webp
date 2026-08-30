<script setup lang="ts">
import { RouterLink } from "vue-router";
import { LuImage, LuVideo } from "vue-icons-plus/lu";
</script>

<template>
  <div class="tool-route-switch" role="group" aria-label="转换工具">
    <RouterLink to="/webp" exact-active-class="is-active" aria-label="切换到图片转换">
      <LuImage :size="17" aria-hidden="true" />
      <span>图片转换</span>
    </RouterLink>
    <RouterLink to="/video" exact-active-class="is-active" aria-label="切换到视频压缩">
      <LuVideo :size="17" aria-hidden="true" />
      <span>视频压缩</span>
    </RouterLink>
  </div>
</template>

<style scoped lang="less">
.tool-route-switch {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  overflow: hidden;
  height: 50px;
  padding: 3px;
  border: 1px solid @border;
  border-radius: @radius;
  gap: var(--gap-1);
  background: @surface;

  > a {
    display: flex;
    justify-content: center;
    align-items: center;
    min-width: 104px;
    padding: 0 var(--gap-3);
    border-radius: var(--radius-2);
    gap: var(--gap-2);
    color: @text-muted;
    text-decoration: none;
    background: transparent;
    transition:
      color 160ms ease,
      background-color 160ms ease;

    &:hover {
      color: @text;
      background: @surface-hover;
    }

    &:focus-visible {
      outline: 2px solid @accent;
      outline-offset: -2px;
    }

    &.is-active {
      color: @accent;
      background: @accent-soft;
    }
  }
}

@media (max-width: 479.98px) {
  .tool-route-switch {
    flex: 1;

    > a {
      min-width: 0;
      padding: 0 var(--gap-2);
    }
  }
}
</style>
