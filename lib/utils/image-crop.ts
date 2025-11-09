import { Area } from "react-easy-crop"

type CropOptions = {
  brightness?: number // 1 = 100%
  contrast?: number   // 1 = 100%
}

export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0,
  options: CropOptions = {}
): Promise<string> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")

  if (!ctx) {
    throw new Error("Could not get canvas context")
  }

  const maxSize = Math.max(image.width, image.height)
  const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2))

  // Set each dimensions to double largest dimension to allow for a safe area for the
  // image to rotate in without being clipped by canvas context
  canvas.width = safeArea
  canvas.height = safeArea

  // Translate canvas context to a central location on image to allow rotating around the center.
  ctx.translate(safeArea / 2, safeArea / 2)
  ctx.rotate((rotation * Math.PI) / 180)
  ctx.translate(-safeArea / 2, -safeArea / 2)

  // Apply basic filters if provided
  const brightness = options.brightness ?? 1
  const contrast = options.contrast ?? 1
  try {
    // CanvasRenderingContext2D.filter is widely supported on modern browsers
    // Use CSS-like filters for brightness/contrast
    ;(ctx as CanvasRenderingContext2D).filter = `brightness(${brightness}) contrast(${contrast})`
  } catch {
    // No-op if filter unsupported
  }

  // Draw rotated image and store data.
  ctx.drawImage(
    image,
    safeArea / 2 - image.width * 0.5,
    safeArea / 2 - image.height * 0.5
  )
  const data = ctx.getImageData(0, 0, safeArea, safeArea)

  // Set canvas width to final desired crop size - this will clear existing canvas
  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height

  // Paste generated rotate image with correct offsets for x,y crop values.
  ctx.putImageData(
    data,
    Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
    Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y)
  )

  // Return as data URL
  return canvas.toDataURL("image/png", 1)
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new window.Image()
    image.addEventListener("load", () => resolve(image))
    image.addEventListener("error", (error) => reject(error))
    image.src = url
  })
}
