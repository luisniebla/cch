const { kv } = require('@vercel/kv');

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    const bills = (await kv.get('bills')) || [];
    return res.json({ bills });
  }
  if (req.method === 'POST') {
    await kv.set('bills', req.body.bills || []);
    return res.json({ success: true });
  }
  res.status(405).end();
};
