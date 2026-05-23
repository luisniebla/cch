import { useState, useEffect } from 'react';
import WaterfallDashboard from './components/WaterfallDashboard';
import PlaidLinkButton from './components/PlaidLinkButton';

export default function App() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadAccounts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/accounts');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAccounts(data.accounts || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAccounts(); }, []);

  return (
    <div className="app">
      <header>
        <h1>Finance Overview</h1>
        <PlaidLinkButton onSuccess={loadAccounts} />
      </header>

      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}

      {loading ? (
        <div className="loading">Loading accounts…</div>
      ) : (
        <WaterfallDashboard accounts={accounts} onRefresh={loadAccounts} />
      )}
    </div>
  );
}
