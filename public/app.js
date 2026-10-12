const products = [
  { id: 'clasico', name: 'El Clásico', description: 'Cerdo, paprika y un toque de ajo', price: 18500, unit: '450 g · 6 unidades', category: 'tradicional', badge: 'El favorito', image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=85' },
  { id: 'ahumado', name: 'Ahumado de la casa', description: 'Notas de madera, pimienta negra y comino', price: 21000, unit: '450 g · 6 unidades', category: 'especial', badge: 'Más pedido', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=85' },
  { id: 'picante', name: 'Picante sabroso', description: 'Ají dulce, chile rojo y el calor justo', price: 19500, unit: '450 g · 6 unidades', category: 'especial', badge: 'Nuevo', image: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&w=900&q=85' }
]

const state = { cart: JSON.parse(localStorage.getItem('la-chori-cart') || '{}') }
const money = (value) => `$${value.toLocaleString('es-CO')}`
const $ = (selector) => document.querySelector(selector)

function saveCart() {
  localStorage.setItem('la-chori-cart', JSON.stringify(state.cart))
}

function renderProducts(filter = 'todos') {
  const visible = filter === 'todos' ? products : products.filter((product) => product.category === filter)
  $('#product-grid').innerHTML = visible.map((product) => `<article class="product-card"><div class="product-image"><img src="${product.image}" alt="${product.name}" loading="lazy" /><span class="product-badge">${product.badge}</span></div><div class="product-info"><h3>${product.name}</h3><p>${product.description}</p><div class="product-bottom"><div><span class="product-price">${money(product.price)}</span><small> / paquete</small></div><button class="add-button" data-add="${product.id}" aria-label="Agregar ${product.name}"><i data-lucide="plus"></i></button></div></div></article>`).join('')
  lucide.createIcons()
}

function cartItems() { return Object.entries(state.cart).map(([id, quantity]) => ({ product: products.find((product) => product.id === id), quantity })).filter((item) => item.product) }
function renderCart() {
  const items = cartItems()
  const count = items.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  const delivery = subtotal === 0 || subtotal >= 60000 ? 0 : 5000
  $('#cart-count').textContent = count
  $('#cart-items').innerHTML = items.map(({ product, quantity }) => `<div class="cart-line"><img src="${product.image}" alt="" /><div><h3>${product.name}</h3><small>${product.unit}</small><div class="quantity"><button data-minus="${product.id}" aria-label="Quitar una unidad">−</button><span>${quantity}</span><button data-plus="${product.id}" aria-label="Agregar una unidad">+</button></div></div><strong>${money(product.price * quantity)}</strong></div>`).join('')
  $('#cart-empty').style.display = items.length ? 'none' : 'block'
  $('#cart-summary').style.display = items.length ? 'block' : 'none'
  $('#cart-subtotal').textContent = money(subtotal)
  $('#cart-delivery').textContent = delivery ? money(delivery) : 'Gratis'
  $('#cart-total').textContent = money(subtotal + delivery)
}

function showToast(message) { const toast = $('#toast'); toast.textContent = message; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 2200) }
function setDrawer(open) { $('#cart-drawer').classList.toggle('open', open); $('#overlay').classList.toggle('visible', open) }
function changeQuantity(id, amount) { state.cart[id] = (state.cart[id] || 0) + amount; if (state.cart[id] <= 0) delete state.cart[id]; saveCart(); renderCart() }

$('#product-grid').addEventListener('click', (event) => { const button = event.target.closest('[data-add]'); if (!button) return; changeQuantity(button.dataset.add, 1); showToast('Agregado a tu bolsita'); setDrawer(true) })
$('#cart-items').addEventListener('click', (event) => { const button = event.target.closest('[data-plus], [data-minus]'); if (!button) return; changeQuantity(button.dataset.plus || button.dataset.minus, button.dataset.plus ? 1 : -1) })
$('#open-cart').addEventListener('click', () => setDrawer(true))
$('#close-cart').addEventListener('click', () => setDrawer(false))
$('#overlay').addEventListener('click', () => setDrawer(false))
$('#go-menu').addEventListener('click', () => setDrawer(false))

document.querySelectorAll('[data-filter]').forEach((button) => button.addEventListener('click', () => { document.querySelectorAll('[data-filter]').forEach((tab) => tab.classList.remove('active')); button.classList.add('active'); renderProducts(button.dataset.filter) }))

$('#checkout-button').addEventListener('click', () => { if (!cartItems().length) return; $('#checkout-modal').classList.add('open'); $('#checkout-modal').setAttribute('aria-hidden', 'false') })
$('#close-modal').addEventListener('click', () => { $('#checkout-modal').classList.remove('open'); $('#checkout-modal').setAttribute('aria-hidden', 'true') })
$('#checkout-form').addEventListener('submit', async (event) => {
  event.preventDefault()
  const form = new FormData(event.target)
  const button = event.target.querySelector('button[type="submit"]')
  button.disabled = true
  button.firstChild.textContent = 'Enviando... '
  const response = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ customer: { name: form.get('name'), phone: form.get('phone'), address: form.get('address'), notes: form.get('notes') }, items: cartItems().map(({ product, quantity }) => ({ productId: product.id, quantity })) }) })
  const result = await response.json()
  button.disabled = false
  button.firstChild.textContent = 'Pedir ahora '
  if (!response.ok) { $('#form-error').textContent = result.error || 'No pudimos recibir tu pedido.'; return }
  state.cart = {}; saveCart(); renderCart(); $('#checkout-modal').classList.remove('open'); setDrawer(false); event.target.reset(); showToast(`Pedido ${result.orderNumber} recibido. ¡Gracias!`)
})

renderProducts(); renderCart(); lucide.createIcons()
