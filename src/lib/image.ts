const LADO = 1000

/** Recorta al centro en cuadrado, redimensiona a 1000x1000 y devuelve un JPEG. */
export async function procesarFoto(file: File): Promise<Blob> {
  const bitmap = await crearBitmap(file)
  const lado = Math.min(bitmap.width, bitmap.height)
  const sx = (bitmap.width - lado) / 2
  const sy = (bitmap.height - lado) / 2
  const destino = Math.min(LADO, lado)

  const canvas = document.createElement('canvas')
  canvas.width = destino
  canvas.height = destino
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No se pudo procesar la imagen')
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(bitmap, sx, sy, lado, lado, 0, 0, destino, destino)
  if ('close' in bitmap) bitmap.close()

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('No se pudo generar el JPEG'))),
      'image/jpeg',
      0.85,
    )
  })
}

async function crearBitmap(file: File): Promise<ImageBitmap & { close?: () => void }> {
  if ('createImageBitmap' in window) {
    return createImageBitmap(file)
  }
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = () => reject(new Error('No se pudo leer la imagen'))
      el.src = url
    })
    return img as unknown as ImageBitmap
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 0)
  }
}

export function blobADataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

/**
 * Convierte una data: URL de imagen en Blob.
 *
 * Valida el prefijo a propósito: esto se llama con strings que vienen de un
 * backup, y un backup es un archivo que alguien te puede mandar. Sin la
 * validación, un "backup" con "fotos": { "x": "https://donde-sea/pixel.png" }
 * hacía que la app pidiera esa URL sola al importarlo, avisándole al que lo
 * mandó que lo abriste y desde qué IP.
 */
export async function dataUrlABlob(dataUrl: string): Promise<Blob> {
  if (!/^data:image\/(png|jpeg|jpg|webp|gif);base64,/i.test(dataUrl)) {
    throw new Error('La foto del backup no tiene un formato válido.')
  }
  const res = await fetch(dataUrl)
  return res.blob()
}
