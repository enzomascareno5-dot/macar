import { useEffect, useState } from 'react'
import { cargarFoto } from './db'

/**
 * Devuelve una URL usable en un <img> para una foto guardada en IndexedDB.
 * Libera la URL al desmontar o al cambiar de foto: en la galería hay muchas
 * a la vez y si no se revocan quedan ocupando memoria.
 */
export function useFotoUrl(fotoId: string | null): string | null {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!fotoId) {
      setUrl(null)
      return
    }

    let vivo = true
    let objectUrl: string | null = null

    cargarFoto(fotoId).then((blob) => {
      if (!vivo || !blob) return
      objectUrl = URL.createObjectURL(blob)
      setUrl(objectUrl)
    })

    return () => {
      vivo = false
      setUrl(null)
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [fotoId])

  return url
}
