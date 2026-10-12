import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { serveStatic } from '@hono/node-server/serve-static'

const app = new Hono()
const port = Number(process.env.PORT) || 3000

const products = [
  { id: 'clasico', name: 'El Clásico', description: 'Cerdo, paprika y un toque de ajo', price: 18500, unit: '450 g · 6 unidades', category: 'tradicional', badge: 'El favorito', image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=85' },
  { id: 'ahumado', name: 'Ahumado de la casa', description: 'Notas de madera, pimienta negra y comino', price: 21000, unit: '450 g · 6 unidades', category: 'especial', badge: 'Más pedido', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=85' },
  { id: 'picante', name: 'Picante sabroso', description: 'Ají dulce, chile rojo y el calor justo', price: 19500, unit: '450 g · 6 unidades', category: 'especial', badge: 'Nuevo', image: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&w=900&q=85' }
]

app.use('*', logger())
app.use('/assets/*', serveStatic({ root: './public' }))
app.get('/', serveStatic({ path: './public/index.html' }))
app.get('/styles.css', serveStatic({ path: './public/styles.css' }))
app.get('/app.js', serveStatic({ path: './public/app.js' }))

app.get('/api/products', (c) => c.json(products))

app.post('/api/orders', async (c) => {
  const body = await c.req.json().catch(() => null) as { customer?: { name?: string; phone?: string; address?: string; notes?: string }; items?: { productId?: string; quantity?: number }[] } | null
  const customer = body?.customer
  const items = body?.items

  if (!customer?.name || !customer.phone || !customer.address || !items?.length) {
    return c.json({ error: 'Completa tus datos y agrega al menos un producto.' }, 400)
  }

  const orderItems = items.map((item) => {
    const product = products.find((candidate) => candidate.id === item.productId)
    const quantity = Math.max(1, Math.floor(item.quantity || 1))
    return product ? { ...product, quantity, subtotal: product.price * quantity } : null
  }).filter((item): item is NonNullable<typeof item> => item !== null)

  if (!orderItems.length) return c.json({ error: 'No encontramos los productos del pedido.' }, 400)

  const subtotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0)
  const delivery = subtotal >= 60000 ? 0 : 5000
  const orderNumber = `CH-${Date.now().toString().slice(-6)}`
  console.log(`[pedido ${orderNumber}] ${customer.name} - $${(subtotal + delivery).toLocaleString('es-CO')}`)

  return c.json({ orderNumber, total: subtotal + delivery, delivery, message: 'Pedido recibido' }, 201)
})

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`La Chori lista en http://localhost:${info.port}`)
})
