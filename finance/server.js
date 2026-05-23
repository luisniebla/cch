require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } = require('plaid');

const app = express();
app.use(express.json());
app.use(cors());

const plaidClient = new PlaidApi(
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

const TOKENS_FILE = path.join(__dirname, '.tokens.json');
const BILLS_FILE = path.join(__dirname, '.bills.json');

const readJson = (file, fallback) => {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch { return fallback; }
};
const writeJson = (file, data) => fs.writeFileSync(file, JSON.stringify(data));

app.post('/api/create-link-token', async (req, res) => {
  try {
    const response = await plaidClient.linkTokenCreate({
      user: { client_user_id: 'finance-app-user' },
      client_name: 'Finance Overview',
      products: [Products.Transactions],
      country_codes: [CountryCode.Us],
      language: 'en',
    });
    res.json({ link_token: response.data.link_token });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data?.error_message || err.message });
  }
});

app.post('/api/exchange-token', async (req, res) => {
  try {
    const { public_token, institution } = req.body;
    const response = await plaidClient.itemPublicTokenExchange({ public_token });
    const tokens = readJson(TOKENS_FILE, []);
    tokens.push({ access_token: response.data.access_token, institution: institution || 'Bank' });
    writeJson(TOKENS_FILE, tokens);
    res.json({ success: true });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data?.error_message || err.message });
  }
});

app.get('/api/accounts', async (req, res) => {
  try {
    const tokens = readJson(TOKENS_FILE, []);
    if (tokens.length === 0) return res.json({ accounts: [] });
    const results = await Promise.all(
      tokens.map(async ({ access_token, institution }) => {
        const r = await plaidClient.accountsGet({ access_token });
        return r.data.accounts.map(a => ({ ...a, institution }));
      })
    );
    res.json({ accounts: results.flat() });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data?.error_message || err.message });
  }
});

app.get('/api/bills', (req, res) => {
  res.json({ bills: readJson(BILLS_FILE, []) });
});

app.post('/api/bills', (req, res) => {
  writeJson(BILLS_FILE, req.body.bills || []);
  res.json({ success: true });
});

app.delete('/api/tokens', (req, res) => {
  writeJson(TOKENS_FILE, []);
  res.json({ success: true });
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (req, res) =>
    res.sendFile(path.join(__dirname, 'dist', 'index.html'))
  );
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server on http://localhost:${PORT}`));
