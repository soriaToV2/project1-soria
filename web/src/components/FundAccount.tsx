'use client';
import { useState } from 'react';
import { fundTestnetAccount } from '@/lib/stellar';

interface Props {
  publicKey: string;
  onFunded: () => void;
}

export default function FundAccount({ publicKey, onFunded }: Props) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const fund = async () => {
    setBusy(true);
    setMsg('');
    setError('');
    try {
      await fundTestnetAccount(publicKey);
      setMsg('Account funded with ~10,000 XLM from Friendbot!');
      onFunded();
      setTimeout(() => setMsg(''), 4000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Funding failed');
      setTimeout(() => setError(''), 4000);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <button
        id="btn-fund-account"
        onClick={fund}
        disabled={busy}
        className="btn btn-ghost"
        style={{ fontSize: 13 }}
      >
        {busy ? (
          <><span className="spinner" /> Funding…</>
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2v20M2 12h20" />
            </svg>
            Fund via Friendbot
          </>
        )}
      </button>
      {msg && <p className="alert alert-success" style={{ marginTop: 8, fontSize: 12 }}>{msg}</p>}
      {error && <p className="alert alert-error" style={{ marginTop: 8, fontSize: 12 }}>{error}</p>}
    </div>
  );
}
