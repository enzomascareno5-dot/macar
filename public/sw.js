// Service worker de Macar. Hace dos cosas:
//  1. Que la app abra sin internet.
//  2. Que el navegador la trate como app instalada, que es lo que hace que no
//     le borre las recetas cuando ande corto de espacio.
//
// No cachea las recetas: esas viven en IndexedDB, que es otra cosa.
//
// Dos estrategias distintas a propósito:
//  - El HTML va por red primero. Es el archivo que decide qué versión de la app
//    se carga, así que si hay internet queremos la última. Con caché primero,
//    una actualización recién aparecía la segunda vez que abría la app.
//  - El resto (JS, CSS, imágenes) va por caché primero. Vite les pone un hash
//    en el nombre, así que un archivo con un nombre dado nunca cambia: si está
//    cacheado, es el correcto.

const CACHE = 'macar-v2'

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

async function red_primero(pedido) {
  const cache = await caches.open(CACHE)
  try {
    const respuesta = await fetch(pedido)
    if (respuesta && respuesta.ok) cache.put(pedido, respuesta.clone())
    return respuesta
  } catch {
    // Sin internet: servimos lo último que vimos.
    const guardado = await cache.match(pedido)
    if (guardado) return guardado

    const index = await cache.match('./index.html')
    if (index) return index

    return new Response('Sin conexión', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }
}

async function cache_primero(pedido) {
  const cache = await caches.open(CACHE)
  const guardado = await cache.match(pedido)
  if (guardado) return guardado

  const respuesta = await fetch(pedido)
  if (respuesta && respuesta.ok) cache.put(pedido, respuesta.clone())
  return respuesta
}

self.addEventListener('fetch', (evento) => {
  const pedido = evento.request
  if (pedido.method !== 'GET') return
  if (new URL(pedido.url).origin !== self.location.origin) return

  const esNavegacion =
    pedido.mode === 'navigate' || pedido.destination === 'document'

  evento.respondWith(esNavegacion ? red_primero(pedido) : cache_primero(pedido))
})
