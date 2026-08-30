<script setup lang="ts">
import { LuArrowRight } from "vue-icons-plus/lu";

import type { ConversionSizeTotals } from "@/types/converter";
import { formatFileSize } from "@/utils/files";

defineProps<{
  totals: ConversionSizeTotals;
}>();
</script>

<template>
  <div class="size-totals" role="region" aria-labelledby="size-totals-title">
    <div class="section-heading">
      <div>
        <span id="size-totals-title" class="section-title">体积总计</span>
        <span v-if="totals.successCount" class="section-description">
          已统计 {{ totals.successCount }} 张成功图片
        </span>
      </div>
      <span v-if="totals.successCount" class="comparison-badge" :class="{ 'is-larger': totals.isLarger }">
        {{ totals.isLarger ? "增加" : "节省" }} {{ totals.percentage }}%
      </span>
    </div>

    <div class="metrics">
      <div class="metric">
        <span>转换前</span>
        <span class="metric-value">{{ formatFileSize(totals.originalSize) }}</span>
      </div>
      <LuArrowRight class-name="comparison-arrow" :size="21" aria-hidden="true" />
      <div class="metric metric-after">
        <span>转换后</span>
        <span class="metric-value">{{ formatFileSize(totals.convertedSize) }}</span>
      </div>
    </div>

    <div class="difference" :class="{ 'is-larger': totals.isLarger }">
      <span>{{ totals.isLarger ? "累计增加" : "累计节省" }}</span>
      <span class="difference-value">{{ totals.successCount ? formatFileSize(totals.difference) : "0 B" }}</span>
    </div>
  </div>
</template>

<style scoped lang="less">
.size-totals {
  overflow: hidden;
  border: 1px solid @border;
  border-radius: @radius;
  box-shadow: 0 16px 48px fade(#000, 22%);
  background: @surface;
}

.section-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 80px;
  padding: 16px 20px;
  border-bottom: 1px solid @border;
  gap: 18px;

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

.comparison-badge {
  flex: 0 0 auto;
  padding: 6px 10px;
  border: 1px solid fade(@accent, 32%);
  border-radius: 5px;
  color: @accent;
  font-size: 14px;
  font-weight: 700;
  background: @accent-soft;

  &.is-larger {
    border-color: fade(@warning, 34%);
    color: @warning;
    background: fade(@warning, 10%);
  }
}

.metrics {
  display: grid;
  align-items: center;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  padding: 23px 20px 18px;
  gap: 16px;
}

.metric {
  display: grid;
  min-width: 0;
  gap: 6px;

  > span:first-child {
    color: @text-muted;
    font-size: 14px;
  }

  .metric-value {
    display: block;
    overflow: hidden;
    color: @text;
    font-size: 22px;
    font-variant-numeric: tabular-nums;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.metric-after {
  text-align: right;
}

.comparison-arrow {
  color: @text-dim;
}

.difference {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0 20px 20px;
  padding: 13px 14px;
  border-left: 2px solid @accent;
  border-radius: 0 5px 5px 0;
  color: @text-muted;
  font-size: 14px;
  background: @accent-soft;

  .difference-value {
    color: @accent;
    font-size: 15px;
    font-variant-numeric: tabular-nums;
  }

  &.is-larger {
    border-left-color: @warning;
    background: fade(@warning, 10%);

    .difference-value {
      color: @warning;
    }
  }
}

@media (max-width: 767.98px) {
  .metrics {
    padding-top: 18px;
  }

  .metric-value {
    font-size: 21px;
  }
}
</style>
