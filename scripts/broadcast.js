require('dotenv').config();
const db = require('../lib/db');
const wa = require('../lib/whatsapp');

// Run locally (or via a GitHub Action / cron) for large broadcast lists,
// since Vercel serverless functions time out after 10-60s.
// Usage: node scripts/broadcast.js template_name

async function runBroadcast(templateName) {
  const { rows: customers } = await db.query('SELECT wa_id FROM customers WHERE opted_in = true');
  console.log(`Sending "${templateName}" to ${customers.length} customers...`);

  let sent = 0;
  for (const c of customers) {
    try {
      await wa.sendTemplate(c.wa_id, templateName);
      sent++;
      await new Promise((r) => setTimeout(r, 300)); // gentle rate limiting
    } catch (err) {
      console.error(`Failed to send to ${c.wa_id}:`, err.response?.data || err.message);
    }
  }

  await db.query('INSERT INTO broadcasts (template_name, sent_count) VALUES ($1, $2)', [templateName, sent]);
  console.log(`Broadcast complete. Sent: ${sent}/${customers.length}`);
  process.exit(0);
}

const templateArg = process.argv[2];
if (!templateArg) {
  console.log('Usage: node scripts/broadcast.js <approved_template_name>');
  process.exit(1);
}

runBroadcast(templateArg);
