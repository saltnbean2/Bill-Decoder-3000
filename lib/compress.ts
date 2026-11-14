export interface PreparedFile {
  base64: string; // no data: prefix
  mediaType: string;
  previewUrl: string; // for the thumbnail
}

const MAX_SIDE = 1600;
const QUALITY = 0.85;

function readAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

async function loadImage(blob: Blob): Promise<ImageBitmap | HTMLImageElement> {
  // createImageBitmap respects EXIF orientation in modern browsers.
  if ("createImageBitmap" in window) {
    try {
      return await createImageBitmap(blob, { imageOrientation: "from-image" });
    } catch {
      /* fall through (e.g. HEIC on some browsers) */
    }
  }
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

/** Resize so the longest side is <= 1600px, re-encode as JPEG q0.85. PDFs pass through. */
export async function prepareFile(file: Blob): Promise<PreparedFile> {
  if (file.type === "application/pdf") {
    const dataUrl = await readAsDataUrl(file);
    return { base64: dataUrl.split(",")[1], mediaType: "application/pdf", previewUrl: "" };
  }
  const img = await loadImage(file);
  const w = img.width;
  const h = img.height;
  const scale = Math.min(1, MAX_SIDE / Math.max(w, h));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no canvas");
  ctx.fillStyle = "#fff"; // transparent PNGs -> white, not black
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  if ("close" in img) img.close();
  const dataUrl = canvas.toDataURL("image/jpeg", QUALITY);
  return { base64: dataUrl.split(",")[1], mediaType: "image/jpeg", previewUrl: dataUrl };
}
