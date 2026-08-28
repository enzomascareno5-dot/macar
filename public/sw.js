// Service worker de Macar. Hace dos cosas:
//  1. Que la app abra sin internet (cachea todo lo suyo a medida que lo pide).
//  2. Que el navegador la trate como app instalada, que es lo que hace que no
//     le borre las recetas cuando ande corto de espacio.
//
// No cachea las recetas: esas viven en IndexedDB, que es otra cosa.

const CACHE = 'macar-v1'

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    (async () => {
      const nombres = await caches.keys()
      await Promise.all(nombres.filter((n) => n !== CACHE).map((n) => caches.delete(n)))
      await self.clients.claim()
    })(),
  )
})

self.addEventListener('fetch', (evento) => {
  const pedido = evento.request
  if (pedido.method !== 'GET') return
  if (new URL(pedido.url).origin !== self.location.origin) return

  evento.respondWith(
    (async () => {
      const cache = await caches.open(CACHE)
      const guardado = await cache.match(pedido)

      // Stale-while-revalidate: contesta con lo cacheado y actualiza atrás.
      const desdeLaRed = fetch(pedido)
        .then((respuesta) => {
          if (respuesta && respuesta.ok) cache.put(pedido, respuesta.clone())
          return respuesta
        })
        .catch(() => null)

      if (guardado) return guardado

      const respuesta = await desdeLaRed
      if (respuesta) return respuesta

      // Sin internet y sin cache: si estaba navegando, le damos el index.
      if (pedido.mode === 'navigate') {
        const index = await cache.match('./index.html')
        if (index) return index
      }

      return new Response('Sin conexión', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      })
    })(),
  )
})
