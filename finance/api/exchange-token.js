const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');
const { kv } = require('@vercel/kv');

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
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const { public_token, institution } = req.body;
    const { data } = await plaid.itemPublicTokenExchange({ public_token });
    const tokens = (await kv.get('tokens')) || [];
    tokens.push({ access_token: data.access_token, institution: institution || 'Bank' });
    await kv.set('tokens', tokens);
    res.json({ success: true });
  } catch (err) {
    const msg = err.response?.data?.error_message || err.message;
    console.error(msg);
    res.status(500).json({ error: msg });
  }
};
