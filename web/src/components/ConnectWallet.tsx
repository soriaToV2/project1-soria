'use client';
import { useState } from 'react';
import type { WalletState } from '@/hooks/useWallet';

export default function ConnectWallet({
  publicKey,
  connecting,
  error,
  connect,
  disconnect,
}: WalletState) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!publicKey) return;
    await navigator.clipboard.writeText(publicKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  if (publicKey) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Connected pill */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 14px',
          background: 'rgba(14,165,233,0.1)',
          border: '1px solid rgba(14,165,233,0.25)',
          borderRadius: 99,
        }}>
          <span style={{
            width: 7, height: 7, borderRadius: '50%',
            background: 'var(--emerald-400)',
            boxShadow: '0 0 6px var(--emerald-400)',
            flexShrink: 0,
          }} />
          <button
            id="btn-copy-address"
            onClick={copy}
            title="Copy full address"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-geist-mono), monospace',
              fontSize: 12,
              color: 'var(--sky-300)',
              padding: 0,
            }}
          >
            {copied ? '✓ Copied' : `${publicKey.slice(0, 6)}…${publicKey.slice(-6)}`}
          </button>
        </div>
        <button
          id="btn-disconnect"
          onClick={disconnect}
          className="btn btn-danger"
          style={{ padding: '6px 12px', fontSize: 12 }}
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'right' }}>
      <button
        id="btn-connect-freighter"
        onClick={connect}
        disabled={connecting}
        className="btn btn-primary"
        style={{ gap: 8 }}
      >
        {connecting ? (
          <>
            <span className="spinner" />
            Connecting…
          </>
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" />
              <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
              <line x1="12" y1="12" x2="12" y2="16" />
              <line x1="10" y1="14" x2="14" y2="14" />
            </svg>
            Connect Freighter
          </>
        )}
      </button>
      {error && (
        <p className="alert alert-error" style={{ marginTop: 8, maxWidth: 280 }}>
          {error}
        </p>
      )}
    </div>
  );
}
