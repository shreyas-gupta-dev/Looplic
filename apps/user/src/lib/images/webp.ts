const WEBP_QUALITY = 0.86;
const MAX_DIMENSION = 1600;

const RASTER_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/bmp",
  "image/x-ms-bmp",
]);

const loadImageElement = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to load image for WebP conversion."));
    image.src = src;
  });

const createWebpBlob = (canvas: HTMLCanvasElement) =>
  new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Unable to create a WebP image."));
        return;
      }

      resolve(blob);
    }, "image/webp", WEBP_QUALITY);
  });

const getScaledDimensions = (width: number, height: number) => {
  if (width <= MAX_DIMENSION && height <= MAX_DIMENSION) {
    return { width, height };
  }

  const scale = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
};

export const canConvertFileToWebp = (file: File) => RASTER_IMAGE_TYPES.has(file.type);

export const convertFileToWebp = async (file: File) => {
  if (!canConvertFileToWebp(file)) {
    return file;
  }

  if (file.type === "image/webp") {
    return file;
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await loadImageElement(objectUrl);
    const { width, height } = getScaledDimensions(image.naturalWidth || image.width, image.naturalHeight || image.height);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Canvas is not available for WebP conversion.");
    }

    context.drawImage(image, 0, 0, width, height);

    const webpBlob = await createWebpBlob(canvas);
    const fileBaseName = file.name.replace(/\.[^.]+$/, "") || "image";

    return new File([webpBlob], `${fileBaseName}.webp`, {
      type: "image/webp",
      lastModified: Date.now(),
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};
