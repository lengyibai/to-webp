import type { ConvertedImage } from "@/types/converter";

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
          return;
        }
        reject(new Error("浏览器无法生成 WebP 文件"));
      },
      "image/webp",
      quality,
    );
  });
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("无法读取该图片"));
    };
    image.src = objectUrl;
  });
}

async function decodeImage(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (!("createImageBitmap" in window)) return loadImage(file);

  try {
    return await createImageBitmap(file);
  } catch {
    throw new Error("无法读取该图片");
  }
}

const getTargetDimensions = (width: number, height: number, maxEdge: number | null) => {
  const longestEdge = Math.max(width, height);
  if (maxEdge === null || longestEdge <= maxEdge) return { width, height };

  const scale = maxEdge / longestEdge;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
};

export async function convertToWebp(file: File, quality: number, maxEdge: number | null): Promise<ConvertedImage> {
  const image = await decodeImage(file);
  const isBitmap = typeof ImageBitmap !== "undefined" && image instanceof ImageBitmap;
  const sourceWidth = image.width || (image as HTMLImageElement).naturalWidth;
  const sourceHeight = image.height || (image as HTMLImageElement).naturalHeight;

  if (!sourceWidth || !sourceHeight) {
    if (isBitmap) image.close();
    throw new Error("图片尺寸无效");
  }

  const { width, height } = getTargetDimensions(sourceWidth, sourceHeight, maxEdge);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");

  if (!context) {
    if (isBitmap) image.close();
    throw new Error("浏览器无法创建图片画布");
  }

  try {
    context.drawImage(image, 0, 0, width, height);
    const blob = await canvasToBlob(canvas, quality);
    return {
      blob,
      originalWidth: sourceWidth,
      originalHeight: sourceHeight,
      width,
      height,
    };
  } finally {
    if (isBitmap) image.close();
    canvas.width = 0;
    canvas.height = 0;
  }
}
