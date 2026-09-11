const db = require('../lib/db');

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).send('Method Not Allowed');
  const { rows } = await db.query('SELECT * FROM orders ORDER BY id DESC');
  res.status(200).json(rows);
};
