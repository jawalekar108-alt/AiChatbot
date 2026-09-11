const db = require('../lib/db');
const wa = require('../lib/whatsapp');

// NOTE: Vercel serverless functions have a max execution time (10s on Hobby,
// 60s on Pro). This works fine for a handful to a few hundred customers, but
// for large broadcast lists, use scripts/broadcast.js locally or via a
// GitHub Action instead - it has no such time limit.

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const auth = req.headers.authorization || '';
  const expected = `Bearer ${process.env.ADMIN_PASSWORD}`;
  if (auth !== expected) return res.status(401).send('Unauthorized');

  const { templateName } = req.body || {};
  if (!templateName) return res.status(400).json({ error: 'templateName is required' });

  const { rows: customers } = await db.query('SELECT wa_id FROM customers WHERE opted_in = true');

  let sent = 0;
  for (const c of customers) {
    try {
      await wa.sendTemplate(c.wa_id, templateName);
      sent++;
    } catch (err) {
      console.error(`Failed to send to ${c.wa_id}:`, err.response?.data || err.message);
    }
  }

  await db.query('INSERT INTO broadcasts (template_name, sent_count) VALUES ($1, $2)', [templateName, sent]);
  res.status(200).json({ sent, total: customers.length });
};
