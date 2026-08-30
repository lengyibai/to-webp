import { orderBy } from "es-toolkit/array";
import { sumBy } from "es-toolkit/math";
import { useStorage } from "@vueuse/core";
import { computed, ref, shallowRef } from "vue";

import { createZipBlob, downloadBlob } from "@/services/download";
import { convertToWebp } from "@/services/image-converter";
import type {
  ConversionProgress,
  ConversionResult,
  ConversionSizeTotals,
  ConversionStatus,
  ConversionSuccess,
  ConversionSummary,
} from "@/types/converter";
import {
  createUniqueName,
  getImageFiles,
  getSizeChange,
  normalizeMaxEdge,
  normalizeQuality,
  toWebpName,
} from "@/utils/files";

const qualityStorageKey = "to-webp:quality";

const initialProgress = (): ConversionProgress => ({
  phase: "idle",
  completed: 0,
  total: 0,
  percent: 0,
  currentFile: "",
});

function getResultPriority(result: ConversionResult): number {
  if (result.state === "error" && result.reason === "unsupported-type") return 3;
  if (result.state === "success" && result.isLarger) return 2;
  return 1;
}

export function useImageConverter() {
  /** WebP 输出品质，自动同步到浏览器本地存储 */
  const quality = useStorage(qualityStorageKey, 90);
  quality.value = normalizeQuality(quality.value);
  /** 图片输出最长边限制，null 表示保留原尺寸 */
  const maxEdge = ref<number | null>(null);
  const isProcessing = ref(false);
  const status = ref<ConversionStatus>("idle");
  const progress = ref<ConversionProgress>(initialProgress());
  const summary = ref<ConversionSummary | null>(null);
  const resultItems = shallowRef<ConversionResult[]>([]);
  /** 最近一次选择的有效原始图片 */
  const lastSourceFiles = shallowRef<File[]>([]);
  /** 当前转换结果对应的实际品质 */
  const conversionQuality = ref(quality.value);
  let resultSequence = 0;

  const results = computed(() => orderBy(resultItems.value, [getResultPriority, "id"], ["desc", "desc"]));
  const successfulResults = computed(() =>
    resultItems.value.filter((result): result is ConversionSuccess => result.state === "success"),
  );
  const largerResults = computed(() => successfulResults.value.filter((result) => result.isLarger));
  const downloadableResults = computed(() => successfulResults.value.filter((result) => !result.isLarger));
  const largerCount = computed(() => largerResults.value.length);
  const downloadableCount = computed(() => downloadableResults.value.length);
  const canRecompress = computed(() => Boolean(lastSourceFiles.value.length) && !isProcessing.value);
  const sizeTotals = computed<ConversionSizeTotals>(() => {
    const originalSize = sumBy(successfulResults.value, (result) => result.originalSize);
    const convertedSize = sumBy(successfulResults.value, (result) => result.convertedSize);
    const difference = Math.abs(originalSize - convertedSize);

    return {
      originalSize,
      convertedSize,
      difference,
      percentage: originalSize ? Math.round((difference / originalSize) * 100) : 0,
      isLarger: convertedSize > originalSize,
      successCount: successfulResults.value.length,
    };
  });
  const progressLabel = computed(() => {
    const labels: Record<ConversionProgress["phase"], string> = {
      idle: "正在准备...",
      converting: "正在转换图片",
      packaging: "正在打包 ZIP",
      done: "处理完成",
    };
    return labels[progress.value.phase];
  });
  const summaryText = computed(() => {
    if (!summary.value) return "";
    const { successCount, failureCount, rejectedCount } = summary.value;
    const totalFailureCount = failureCount + rejectedCount;
    const rejectedText = rejectedCount ? `，其中非图片 ${rejectedCount} 个` : "";
    return `成功 ${successCount} 个，失败 ${totalFailureCount} 个${rejectedText}`;
  });

  function appendResult(result: ConversionResult): void {
    resultItems.value = [result, ...resultItems.value];
  }

  function prependRejectedResults(files: File[]): void {
    const rejectedResults: ConversionResult[] = files.map((file) => ({
      id: nextResultId(),
      state: "error",
      reason: "unsupported-type",
      sourceName: file.name,
      errorMessage: "不支持此文件类型，仅支持图片",
    }));
    resultItems.value = [...rejectedResults, ...resultItems.value];
  }

  function nextResultId(): number {
    resultSequence += 1;
    return resultSequence;
  }

  function clearResults(): void {
    resultItems.value = [];
    summary.value = null;
    status.value = "idle";
    progress.value = initialProgress();
  }

  function setQuality(value: number | string): void {
    quality.value = normalizeQuality(value);
  }

  function setMaxEdge(value: number | string | null): void {
    maxEdge.value = normalizeMaxEdge(value);
  }

  const downloadLargerResults = async (): Promise<void> => {
    if (isProcessing.value || !largerResults.value.length) return;

    const downloadFiles = largerResults.value.map((result) => ({
      name: result.outputName,
      blob: result.blob,
    }));
    const total = downloadFiles.length;
    isProcessing.value = true;
    status.value = "processing";
    progress.value = {
      phase: "packaging",
      completed: total,
      total,
      percent: 0,
      currentFile: "正在准备增大图片 ZIP",
    };

    let downloadError: Error | null = null;
    try {
      const zipBlob = await createZipBlob(downloadFiles, (percent) => {
        progress.value = { ...progress.value, percent };
      });
      downloadBlob(zipBlob, "WebP增大图片.zip");
    } catch (error) {
      downloadError = error instanceof Error ? error : new Error("下载文件生成失败");
    } finally {
      progress.value = {
        phase: "done",
        completed: total,
        total,
        percent: 100,
        currentFile: downloadError?.message ?? "增大图片 ZIP 下载已开始",
      };
      status.value = downloadError ? "error" : "success";
      isProcessing.value = false;
    }
  };

  const downloadResult = (result: ConversionSuccess): void => {
    if (isProcessing.value) return;
    downloadBlob(result.blob, result.outputName);
  };

  const downloadCompressedResults = async (): Promise<void> => {
    if (isProcessing.value || !downloadableResults.value.length) return;

    const downloadFiles = downloadableResults.value.map((result) => ({
      name: result.outputName,
      blob: result.blob,
    }));
    const total = downloadFiles.length;
    isProcessing.value = true;
    status.value = "processing";
    progress.value = {
      phase: total > 1 ? "packaging" : "done",
      completed: total,
      total,
      percent: total > 1 ? 0 : 100,
      currentFile: total > 1 ? "正在准备已压缩图片 ZIP" : "正在准备下载文件",
    };

    let downloadError: Error | null = null;
    try {
      if (total === 1) {
        const [file] = downloadFiles;
        if (file) downloadBlob(file.blob, file.name);
      } else {
        const zipBlob = await createZipBlob(downloadFiles, (percent) => {
          progress.value = { ...progress.value, percent };
        });
        downloadBlob(zipBlob, `WebP转换-品质${conversionQuality.value}.zip`);
      }
    } catch (error) {
      downloadError = error instanceof Error ? error : new Error("下载文件生成失败");
    } finally {
      progress.value = {
        phase: "done",
        completed: total,
        total,
        percent: 100,
        currentFile: downloadError?.message ?? "下载已开始",
      };
      status.value = downloadError ? "error" : "success";
      isProcessing.value = false;
    }
  };

  const downloadAllResults = async (): Promise<void> => {
    if (isProcessing.value || !successfulResults.value.length) return;

    const downloadFiles = successfulResults.value.map((result) => ({
      name: result.outputName,
      blob: result.blob,
    }));
    const total = downloadFiles.length;
    isProcessing.value = true;
    status.value = "processing";
    progress.value = {
      phase: total > 1 ? "packaging" : "done",
      completed: total,
      total,
      percent: total > 1 ? 0 : 100,
      currentFile: total > 1 ? "正在准备全部图片 ZIP" : "正在准备下载文件",
    };

    let downloadError: Error | null = null;
    try {
      if (total === 1) {
        const [file] = downloadFiles;
        if (file) downloadBlob(file.blob, file.name);
      } else {
        const zipBlob = await createZipBlob(downloadFiles, (percent) => {
          progress.value = { ...progress.value, percent };
        });
        downloadBlob(zipBlob, `WebP全部图片-品质${conversionQuality.value}.zip`);
      }
    } catch (error) {
      downloadError = error instanceof Error ? error : new Error("下载文件生成失败");
    } finally {
      progress.value = {
        phase: "done",
        completed: total,
        total,
        percent: 100,
        currentFile: downloadError?.message ?? "全部图片下载已开始",
      };
      status.value = downloadError ? "error" : "success";
      isProcessing.value = false;
    }
  };

  async function processFiles(fileList: FileList | File[]): Promise<void> {
    if (isProcessing.value) return;

    const { accepted: files, rejected } = getImageFiles(fileList);
    const rejectedCount = rejected.length;
    if (!files.length) {
      prependRejectedResults(rejected);
      status.value = "error";
      progress.value = initialProgress();
      const previousSummary = summary.value;
      summary.value = {
        successCount: previousSummary?.successCount ?? 0,
        failureCount: previousSummary?.failureCount ?? 0,
        rejectedCount: (previousSummary?.rejectedCount ?? 0) + rejectedCount,
      };
      return;
    }

    lastSourceFiles.value = files;
    clearResults();
    const qualityValue = normalizeQuality(quality.value);
    const maxEdgeValue = normalizeMaxEdge(maxEdge.value);
    quality.value = qualityValue;
    maxEdge.value = maxEdgeValue;
    conversionQuality.value = qualityValue;
    isProcessing.value = true;
    status.value = "processing";
    progress.value = {
      phase: "converting",
      completed: 0,
      total: files.length,
      percent: 0,
      currentFile: rejectedCount ? `已忽略 ${rejectedCount} 个非图片文件` : "",
    };

    const convertedResults: ConversionSuccess[] = [];
    const usedNames = new Set<string>();
    let failureCount = 0;

    for (const [index, file] of files.entries()) {
      progress.value = {
        ...progress.value,
        currentFile: file.name,
        percent: (index / files.length) * 100,
      };

      try {
        const converted = await convertToWebp(file, qualityValue / 100, maxEdgeValue);
        const outputName = createUniqueName(toWebpName(file.name), usedNames);
        const sizeChange = getSizeChange(file.size, converted.blob.size);
        const result: ConversionSuccess = {
          id: nextResultId(),
          state: "success",
          sourceName: file.name,
          outputName,
          blob: converted.blob,
          originalSize: file.size,
          convertedSize: converted.blob.size,
          originalWidth: converted.originalWidth,
          originalHeight: converted.originalHeight,
          width: converted.width,
          height: converted.height,
          sizeChangeValue: sizeChange.value,
          sizeChangePercentage: sizeChange.percentage,
          isLarger: sizeChange.isLarger,
        };
        convertedResults.push(result);
        appendResult(result);
      } catch (error) {
        failureCount += 1;
        appendResult({
          id: nextResultId(),
          state: "error",
          reason: "conversion",
          sourceName: file.name,
          errorMessage: error instanceof Error ? error.message : "转换失败",
        });
      }

      progress.value = {
        ...progress.value,
        completed: index + 1,
        percent: ((index + 1) / files.length) * 100,
      };
    }

    const successCount = convertedResults.length;
    prependRejectedResults(rejected);
    const previousSummary = summary.value;
    summary.value = {
      successCount: (previousSummary?.successCount ?? 0) + successCount,
      failureCount: (previousSummary?.failureCount ?? 0) + failureCount,
      rejectedCount: (previousSummary?.rejectedCount ?? 0) + rejectedCount,
    };
    progress.value = {
      phase: "done",
      completed: files.length,
      total: files.length,
      percent: 100,
      currentFile: successCount ? `${successCount} 张图片转换完成，请手动下载` : "没有可下载的文件",
    };

    if (failureCount > 0 && successCount === 0) status.value = "error";
    else if (failureCount > 0 || rejectedCount > 0) status.value = "partial";
    else status.value = "success";

    isProcessing.value = false;
  }

  const recompress = async (): Promise<void> => {
    if (!canRecompress.value) return;
    await processFiles(lastSourceFiles.value);
  };

  return {
    quality,
    maxEdge,
    isProcessing,
    status,
    progress,
    progressLabel,
    results,
    largerCount,
    downloadableCount,
    canRecompress,
    sizeTotals,
    summary,
    summaryText,
    setQuality,
    setMaxEdge,
    downloadLargerResults,
    downloadResult,
    downloadCompressedResults,
    downloadAllResults,
    processFiles,
    recompress,
  };
}
