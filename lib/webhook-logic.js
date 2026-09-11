const db = require('./db');
const wa = require('./whatsapp');

const SAMPLE_PRODUCTS = [
  { retailer_id: 'saree_001', name: 'Banarasi Silk Saree - Red', price: 3499 },
  { retailer_id: 'saree_002', name: 'Kanjivaram Silk Saree - Green', price: 5999 },
  { retailer_id: 'saree_003', name: 'Cotton Handloom Saree - Blue', price: 1299 },
  { retailer_id: 'saree_004', name: 'Chiffon Party Wear Saree - Black', price: 1899 },
];

async function upsertCustomer(waId, name) {
  await db.query(
    `INSERT INTO customers (wa_id, name) VALUES ($1, $2)
     ON CONFLICT (wa_id) DO UPDATE SET last_active = NOW()`,
    [waId, name || '']
  );
}

async function logMessage(waId, direction, body) {
  await db.query('INSERT INTO messages (wa_id, direction, body) VALUES ($1, $2, $3)', [waId, direction, body]);
}

async function setStage(waId, stage) {
  await db.query('UPDATE customers SET stage = $1 WHERE wa_id = $2', [stage, waId]);
}

async function sendMainMenu(to) {
  await wa.sendButtons(to, 'Namaste! 🙏 Welcome to *Saree Studio*. How can we help you today?', [
    { id: 'browse_catalog', title: '🛍️ Browse Sarees' },
    { id: 'track_order', title: '📦 Track Order' },
    { id: 'talk_human', title: '💬 Talk to Us' },
  ]);
}

async function sendCategoryList(to) {
  await wa.sendList(to, 'Pick a category to explore:', 'View Categories', [
    {
      title: 'Saree Categories',
      rows: [
        { id: 'cat_silk', title: 'Silk Sarees', description: 'Banarasi, Kanjivaram & more' },
        { id: 'cat_cotton', title: 'Cotton Sarees', description: 'Daily wear handloom cotton' },
        { id: 'cat_party', title: 'Party Wear', description: 'Chiffon, Georgette, Sequin work' },
        { id: 'cat_wedding', title: 'Wedding Collection', description: 'Premium bridal sarees' },
      ],
    },
  ]);
}

async function sendProducts(to) {
  const ids = SAMPLE_PRODUCTS.map((p) => p.retailer_id);
  await wa.sendCatalogMessage(to, 'Here are some of our best sarees. Tap any to view details and add to cart:', ids);
}

async function addToCart(waId, retailerId) {
  const product = SAMPLE_PRODUCTS.find((p) => p.retailer_id === retailerId);
  if (!product) return;
  await db.query(
    'INSERT INTO cart_items (wa_id, product_id, product_name, price, qty) VALUES ($1, $2, $3, $4, 1)',
    [waId, product.retailer_id, product.name, product.price]
  );
  await wa.sendButtons(waId, `Added *${product.name}* (₹${product.price}) to your cart!`, [
    { id: 'view_cart', title: '🛒 View Cart' },
    { id: 'browse_catalog', title: '➕ Add More' },
  ]);
}

async function viewCart(waId) {
  const { rows: items } = await db.query('SELECT * FROM cart_items WHERE wa_id = $1', [waId]);
  if (items.length === 0) {
    await wa.sendText(waId, 'Your cart is empty. Type "menu" to start browsing.');
    return;
  }
  let total = 0;
  let text = '*Your Cart:*\n';
  items.forEach((i) => {
    text += `- ${i.product_name} x${i.qty} — ₹${i.price * i.qty}\n`;
    total += Number(i.price) * i.qty;
  });
  text += `\n*Total: ₹${total}*`;
  await wa.sendButtons(waId, text, [
    { id: 'checkout', title: '✅ Checkout' },
    { id: 'browse_catalog', title: '🛍️ Add More' },
  ]);
}

async function checkout(waId) {
  const { rows: items } = await db.query('SELECT * FROM cart_items WHERE wa_id = $1', [waId]);
  if (items.length === 0) {
    await wa.sendText(waId, 'Your cart is empty.');
    return;
  }
  const total = items.reduce((sum, i) => sum + Number(i.price) * i.qty, 0);
  await db.query('INSERT INTO orders (wa_id, items_json, total, status) VALUES ($1, $2, $3, $4)', [
    waId,
    JSON.stringify(items),
    total,
    'pending',
  ]);
  await db.query('DELETE FROM cart_items WHERE wa_id = $1', [waId]);
  await setStage(waId, 'checkout');
  await wa.sendButtons(waId, `Order placed! Total: ₹${total}.\nHow would you like to pay?`, [
    { id: 'pay_cod', title: '💵 Cash on Delivery' },
    { id: 'pay_upi', title: '📲 Pay via UPI' },
  ]);
}

async function handleIncomingMessage(message, contact) {
  const waId = message.from;
  const name = contact?.profile?.name;
  await upsertCustomer(waId, name);

  let text = '';
  let buttonId = null;

  if (message.type === 'text') {
    text = message.text.body.trim().toLowerCase();
  } else if (message.type === 'interactive') {
    if (message.interactive.type === 'button_reply') {
      buttonId = message.interactive.button_reply.id;
    } else if (message.interactive.type === 'list_reply') {
      buttonId = message.interactive.list_reply.id;
    }
  } else if (message.type === 'order') {
    const items = message.order.product_items;
    let total = 0;
    items.forEach((i) => { total += i.item_price * i.quantity; });
    await db.query('INSERT INTO orders (wa_id, items_json, total, status) VALUES ($1, $2, $3, $4)', [
      waId, JSON.stringify(items), total, 'pending',
    ]);
    await wa.sendText(waId, `Thank you! Order received for ₹${total}. We'll confirm shortly. 🙏`);
    return;
  }

  await logMessage(waId, 'in', text || buttonId || '[unsupported message type]');

  const action = buttonId || text;

  switch (action) {
    case 'hi':
    case 'hello':
    case 'menu':
    case 'start':
      await sendMainMenu(waId);
      break;

    case 'browse_catalog':
      await sendCategoryList(waId);
      break;

    case 'cat_silk':
    case 'cat_cotton':
    case 'cat_party':
    case 'cat_wedding':
      await sendProducts(waId);
      break;

    case 'view_cart':
      await viewCart(waId);
      break;

    case 'checkout':
      await checkout(waId);
      break;

    case 'pay_cod':
      await wa.sendText(waId, 'Great! Your order will be delivered with Cash on Delivery. We will share tracking details soon. 🚚');
      await setStage(waId, 'done');
      break;

    case 'pay_upi':
      await wa.sendText(waId, 'Please pay here: upi://pay?pa=yourbusiness@upi&pn=SareeStudio\nSend us the screenshot once done ✅');
      await setStage(waId, 'done');
      break;

    case 'track_order': {
      const { rows } = await db.query(
        'SELECT * FROM orders WHERE wa_id = $1 ORDER BY id DESC LIMIT 1',
        [waId]
      );
      if (rows[0]) {
        await wa.sendText(waId, `Your last order (₹${rows[0].total}) status: *${rows[0].status}*`);
      } else {
        await wa.sendText(waId, "We couldn't find any recent orders for this number.");
      }
      break;
    }

    case 'talk_human':
      await wa.sendText(waId, 'Connecting you to our team — someone will reply here shortly. 🙋');
      await setStage(waId, 'human_handoff');
      break;

    default:
      if (SAMPLE_PRODUCTS.some((p) => p.retailer_id === action)) {
        await addToCart(waId, action);
      } else {
        await wa.sendText(waId, 'Sorry, I didn\'t understand that. Type "menu" to see options.');
      }
  }
}

module.exports = { handleIncomingMessage };
