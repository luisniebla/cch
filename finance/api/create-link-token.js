const { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } = require('plaid');

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
    const { data } = await plaid.linkTokenCreate({
      user: { client_user_id: 'finance-app-user' },
      client_name: 'Finance Overview',
      products: [Products.Transactions],
      country_codes: [CountryCode.Us],
      language: 'en',
    });
    res.json({ link_token: data.link_token });
  } catch (err) {
    const msg = err.response?.data?.error_message || err.message;
    console.error(msg);
    res.status(500).json({ error: msg });
  }
};
