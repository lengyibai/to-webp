import JSZip from "jszip";

import type { DownloadFile } from "@/types/converter";

export function downloadBlob(blob: Blob, fileName: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = fileName;
  link.hidden = true;
  document.body.append(link);
  link.click();

  window.setTimeout(() => {
    link.remove();
    URL.revokeObjectURL(objectUrl);
  }, 1000);
}

export function createZipBlob(files: DownloadFile[], onProgress?: (percent: number) => void): Promise<Blob> {
  const zip = new JSZip();
  for (const file of files) zip.file(file.name, file.blob);

  return zip.generateAsync({ type: "blob", compression: "STORE" }, ({ percent }) => onProgress?.(percent));
}
