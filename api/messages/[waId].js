const db = require('../../lib/db');

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).send('Method Not Allowed');
  const { waId } = req.query;
  const { rows } = await db.query('SELECT * FROM messages WHERE wa_id = $1 ORDER BY id ASC', [waId]);
  res.status(200).json(rows);
};
