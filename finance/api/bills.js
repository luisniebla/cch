const { Redis } = require('@upstash/redis');

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    const bills = (await redis.get('bills')) || [];
    return res.json({ bills });
  }
  if (req.method === 'POST') {
    await redis.set('bills', req.body.bills || []);
    return res.json({ success: true });
  }
  res.status(405).end();
};
