export type ConversionStatus = "idle" | "processing" | "success" | "partial" | "error";

export type ProgressPhase = "idle" | "converting" | "packaging" | "done";

export interface ConversionProgress {
  phase: ProgressPhase;
  completed: number;
  total: number;
  percent: number;
  currentFile: string;
}

export interface ConversionSummary {
  successCount: number;
  failureCount: number;
  rejectedCount: number;
}

export interface ConversionSizeTotals {
  originalSize: number;
  convertedSize: number;
  difference: number;
  percentage: number;
  isLarger: boolean;
  successCount: number;
}

interface ConversionResultBase {
  id: number;
  sourceName: string;
}

export type ConversionFailureReason = "unsupported-type" | "conversion";

export interface ConversionSuccess extends ConversionResultBase {
  /** 转换状态 */
  state: "success";
  /** 输出文件名 */
  outputName: string;
  /** 转换后的图片数据 */
  blob: Blob;
  /** 原始文件体积 */
  originalSize: number;
  /** 转换后的文件体积 */
  convertedSize: number;
  /** 原图宽度 */
  originalWidth: number;
  /** 原图高度 */
  originalHeight: number;
  /** 输出图片宽度 */
  width: number;
  /** 输出图片高度 */
  height: number;
  /** 文件体积变化值 */
  sizeChangeValue: string;
  /** 文件体积变化百分比 */
  sizeChangePercentage: string;
  /** 转换后的文件体积是否增大 */
  isLarger: boolean;
}

export interface ConversionFailure extends ConversionResultBase {
  state: "error";
  reason: ConversionFailureReason;
  errorMessage: string;
}

export type ConversionResult = ConversionSuccess | ConversionFailure;

export interface ConvertedImage {
  /** 转换后的图片数据 */
  blob: Blob;
  /** 原图宽度 */
  originalWidth: number;
  /** 原图高度 */
  originalHeight: number;
  /** 输出图片宽度 */
  width: number;
  /** 输出图片高度 */
  height: number;
}

export interface DownloadFile {
  name: string;
  blob: Blob;
}
