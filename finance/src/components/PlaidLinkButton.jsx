import { usePlaidLink } from 'react-plaid-link';
import { useState, useEffect } from 'react';

export default function PlaidLinkButton({ onSuccess }) {
  const [linkToken, setLinkToken] = useState(null);
  const [tokenError, setTokenError] = useState(null);

  useEffect(() => {
    fetch('/api/create-link-token', { method: 'POST' })
      .then(r => r.json())
      .then(d => {
        if (d.error) { setTokenError(d.error); return; }
        setLinkToken(d.link_token);
      })
      .catch(err => setTokenError(err.message));
  }, []);

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: async (public_token, metadata) => {
      await fetch('/api/exchange-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          public_token,
          institution: metadata.institution?.name,
        }),
      });
      onSuccess();
    },
  });

  if (tokenError) {
    return <span className="token-error" title={tokenError}>Check server .env</span>;
  }

  return (
    <button onClick={() => open()} disabled={!ready} className="connect-btn">
      + Connect Bank
    </button>
  );
}
