const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');
const { Redis } = require('@upstash/redis');

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const plaid = new PlaidApi(
  new Configuration({
    basePath: PlaidEnvironments[process.env.PLAID_ENV || 'sandbox'],
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
        'PLAID-SECRET': process.env.PLAID_SECRET,
      },
    },
  })
);

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).end();
  try {
    const tokens = (await redis.get('tokens')) || [];
    if (tokens.length === 0) return res.json({ accounts: [] });
    const results = await Promise.all(
      tokens.map(async ({ access_token, institution }) => {
        const { data } = await plaid.accountsGet({ access_token });
        return data.accounts.map(a => ({ ...a, institution }));
      })
    );
    res.json({ accounts: results.flat() });
  } catch (err) {
    const msg = err.response?.data?.error_message || err.message;
    console.error(msg);
    res.status(500).json({ error: msg });
  }
};
