import { useState, useEffect } from 'react';
import BillsSetup from './BillsSetup';

const fmt = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n ?? 0);

export default function WaterfallDashboard({ accounts, onRefresh }) {
  const [bills, setBills] = useState([]);
  const [savingsTarget, setSavingsTarget] = useState(
    () => Number(localStorage.getItem('savingsTarget') || 500)
  );
  const [showBillsSetup, setShowBillsSetup] = useState(false);

  useEffect(() => {
    fetch('/api/bills')
      .then(r => r.json())
      .then(d => setBills(d.bills || []));
  }, []);

  const updateSavingsTarget = (val) => {
    setSavingsTarget(val);
    localStorage.setItem('savingsTarget', val);
  };

  const creditCards = accounts.filter(a => a.type === 'credit');
  const depository = accounts.filter(a => a.type === 'depository');

  const totalCash = depository.reduce(
    (sum, a) => sum + (a.balances.available ?? a.balances.current ?? 0), 0
  );
  const totalCCDebt = creditCards.reduce(
    (sum, a) => sum + Math.abs(a.balances.current ?? 0), 0
  );
  const totalBills = bills.reduce((sum, b) => sum + b.amount, 0);

  const afterCC = totalCash - totalCCDebt;
  const afterBills = afterCC - totalBills;
  const freeMoneyRaw = afterBills - savingsTarget;

  const levels = [
    {
      id: 'cc',
      label: 'Pay off credit cards',
      cost: totalCCDebt,
      after: afterCC,
      ok: afterCC >= 0,
      detail:
        creditCards.length === 0
          ? 'No credit cards linked'
          : creditCards
              .map(c => `${c.name} ${fmt(Math.abs(c.balances.current ?? 0))}`)
              .join('  ·  '),
    },
    {
      id: 'bills',
      label: 'Pay bills',
      cost: totalBills,
      after: afterBills,
      ok: afterBills >= 0,
      detail:
        bills.length === 0
          ? 'No bills added yet — tap \"Set up bills\" below'
          : bills.map(b => `${b.name} ${fmt(b.amount)}`).join('  ·  '),
    },
    {
      id: 'savings',
      label: 'Save',
      cost: savingsTarget,
      after: freeMoneyRaw,
      ok: freeMoneyRaw >= 0,
      detail: `Monthly savings goal: ${fmt(savingsTarget)}`,
    },
    {
      id: 'free',
      label: 'Guilt-free spending',
      cost: Math.max(0, freeMoneyRaw),
      after: freeMoneyRaw,
      ok: freeMoneyRaw > 0,
      detail:
        freeMoneyRaw > 0
          ? 'Yours to spend however you want'
          : 'Come up short — adjust bills or savings target',
      isFinal: true,
    },
  ];

  const noAccounts = accounts.length === 0;

  return (
    <div className="dashboard">
      {noAccounts ? (
        <div className="empty-state">
          <p>Connect a bank account above to see your financial overview.</p>
        </div>
      ) : (
        <>
          <div className="total-card">
            <span className="total-label">Available cash</span>
            <span className="total-amount">{fmt(totalCash)}</span>
          </div>

          <div className="waterfall">
            {levels.map((level) => (
              <div key={level.id} className={`level ${level.ok ? 'ok' : 'short'}`}>
                <div className="level-top">
                  <div className="level-left">
                    <span className="level-name">{level.label}</span>
                    <span className="level-detail">{level.detail}</span>
                  </div>
                  <div className="level-right">
                    <span className="level-cost">
                      {level.isFinal
                        ? level.ok ? fmt(level.cost) : fmt(0)
                        : fmt(level.cost)}
                    </span>
                    <span className="level-check">{level.ok ? '✓' : '✗'}</span>
                  </div>
                </div>
                {!level.isFinal && (
                  <div className={`level-remaining ${level.after < 0 ? 'negative' : ''}`}>
                    Remaining after this: {fmt(level.after)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      <div className="controls">
        <button className="setup-btn" onClick={() => setShowBillsSetup(v => !v)}>
          {showBillsSetup ? 'Hide bills' : 'Set up bills'}
        </button>
        <label className="savings-row">
          Savings goal
          <input
            type="number"
            min="0"
            value={savingsTarget}
            onChange={e => updateSavingsTarget(Number(e.target.value))}
            className="savings-input"
          />
        </label>
      </div>

      {showBillsSetup && (
        <BillsSetup bills={bills} onChange={setBills} />
      )}

      {accounts.length > 0 && (
        <div className="accounts-section">
          <div className="accounts-header">
            <h3>Linked accounts</h3>
            <button className="refresh-btn" onClick={onRefresh}>Refresh</button>
          </div>
          {accounts.map(a => (
            <div key={a.account_id} className="account-row">
              <div className="account-info">
                <span className="account-name">{a.name}</span>
                <span className="account-institution">{a.institution}</span>
              </div>
              <div className="account-right">
                <span className="account-balance">{fmt(a.balances.current)}</span>
                <span className="account-type">{a.subtype}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
