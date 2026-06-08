'use client';
import { useState, useEffect } from 'react';
import { fetchBalances, type Balances } from '@/lib/balances';

export default function BalanceCard({
  publicKey,
  refreshKey,
}: {
  publicKey: string;
  refreshKey: number;
}) {
  const [balances, setBalances] = useState<Balances | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchBalances(publicKey)
      .then((b) => active && setBalances(b))
      .catch(() => active && setBalances(null))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [publicKey, refreshKey]);

  if (loading) {
    return (
      <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
        <div style={{ height: 60, flex: 1, borderRadius: 'var(--radius)', background: 'rgba(14,165,233,0.05)' }} className="animate-pulse" />
        <div style={{ height: 60, flex: 1, borderRadius: 'var(--radius)', background: 'rgba(20,184,166,0.05)' }} className="animate-pulse" />
      </div>
    );
  }

  if (balances && !balances.funded) {
    return (
      <div className="alert alert-warning" style={{ marginTop: 12 }}>
        This account isn’t funded yet. Click “Fund via Friendbot” to receive testnet XLM.
      </div>
    );
  }

  if (!balances) {
    return <div className="alert alert-error" style={{ marginTop: 12 }}>Failed to load balances.</div>;
  }

  return (
    <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
      <div className="stat-card" style={{ flex: 1, padding: '12px 16px', textAlign: 'left' }}>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>XLM Balance</p>
        <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--sky-400)', fontFamily: 'Space Grotesk, sans-serif' }}>{balances.xlm}</p>
      </div>
      <div className="stat-card" style={{ flex: 1, padding: '12px 16px', textAlign: 'left' }}>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>USDC Balance</p>
        <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--teal-400)', fontFamily: 'Space Grotesk, sans-serif' }}>{balances.usdc}</p>
      </div>
    </div>
  );
}
