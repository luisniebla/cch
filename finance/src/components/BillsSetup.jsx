import { useState } from 'react';

const saveBills = (bills) =>
  fetch('/api/bills', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bills }),
  });

export default function BillsSetup({ bills, onChange }) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');

  const add = () => {
    if (!name.trim() || !amount) return;
    const updated = [...bills, { id: Date.now(), name: name.trim(), amount: parseFloat(amount) }];
    onChange(updated);
    saveBills(updated);
    setName('');
    setAmount('');
  };

  const remove = (id) => {
    const updated = bills.filter(b => b.id !== id);
    onChange(updated);
    saveBills(updated);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter') add();
  };

  return (
    <div className="bills-panel">
      <h3>Monthly bills</h3>
      {bills.length === 0 && (
        <p className="bills-empty">No bills added yet. Add rent, utilities, subscriptions, etc.</p>
      )}
      {bills.map(b => (
        <div key={b.id} className="bill-row">
          <span className="bill-name">{b.name}</span>
          <span className="bill-amount">${b.amount.toFixed(2)}</span>
          <button className="remove-btn" onClick={() => remove(b.id)} aria-label="Remove">×</button>
        </div>
      ))}
      <div className="add-bill">
        <input
          className="bill-input"
          placeholder="Bill name (e.g. Rent)"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={handleKey}
        />
        <input
          className="bill-input amount-input"
          placeholder="Amount"
          type="number"
          min="0"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          onKeyDown={handleKey}
        />
        <button className="add-btn" onClick={add}>Add</button>
      </div>
    </div>
  );
}
