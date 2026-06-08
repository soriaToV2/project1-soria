'use client';
import { useState } from 'react';
import { useWallet } from '@/hooks/useWallet';
import ConnectWallet from '@/components/ConnectWallet';
import FundAccount from '@/components/FundAccount';
import BalanceCard from '@/components/BalanceCard';
import CctPanel from '@/components/CctPanel';
import { ADMIN_ADDRESS } from '@/lib/stellar';

export default function Home() {
  const wallet = useWallet();
  const { publicKey, connecting } = wallet;
  const [refreshKey, setRefreshKey] = useState(0);
  const isAdmin = publicKey && (ADMIN_ADDRESS ? publicKey === ADMIN_ADDRESS : true);
  // FundAccount needs a refresh for BalanceCard, but CctPanel manages its own state
  const refresh = () => setRefreshKey((k) => k + 1);

  return (
    <main className="min-h-screen" style={{ position: 'relative' }}>
      {/* Animated background */}
      <div className="bg-mesh" />

      <div
        style={{
          position: 'relative',
          zIndex: 10,
          maxWidth: 760,
          margin: '0 auto',
          padding: '0 20px 60px',
        }}
      >
        {/* ── Hero ─────────────────────────────────────────────── */}
        <header
          style={{
            paddingTop: 48,
            paddingBottom: 32,
            borderBottom: '1px solid var(--border)',
            marginBottom: 28,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
            {/* Brand */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <div
                  className="animate-float"
                  style={{
                    width: 44, height: 44, borderRadius: 14,
                    background: 'linear-gradient(135deg, var(--sky-500), var(--teal-500))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 24, flexShrink: 0,
                    boxShadow: 'var(--glow-sky)',
                  }}
                >
                  🏦
                </div>
                <div>
                  <h1
                    style={{
                      fontFamily: 'Space Grotesk, sans-serif',
                      fontSize: 'clamp(20px, 4vw, 28px)',
                      fontWeight: 800,
                      letterSpacing: '-0.02em',
                      lineHeight: 1.1,
                      background: 'linear-gradient(135deg, var(--sky-300), var(--teal-400))',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    StellarCCT
                  </h1>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    Conditional Cash Transfer · Testnet
                  </p>
                </div>
              </div>

              <p style={{
                fontSize: 14,
                color: 'var(--text-secondary)',
                maxWidth: 420,
                lineHeight: 1.65,
              }}>
                Government social transfers without corruption. Funds are released{' '}
                <span style={{ color: 'var(--sky-400)', fontWeight: 600 }}>only when conditions are confirmed on-chain</span>{' '}
                via a Soroban smart contract.
              </p>

              {/* Pill badges */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                {[
                  { label: 'Soroban', color: 'var(--sky-400)' },
                  { label: 'Freighter', color: 'var(--teal-400)' },
                  { label: 'Social Impact', color: 'var(--emerald-400)' },
                  { label: 'Testnet', color: 'var(--amber-400)' },
                ].map(({ label, color }) => (
                  <span
                    key={label}
                    style={{
                      padding: '3px 10px',
                      borderRadius: 99,
                      fontSize: 11,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      background: `${color}15`,
                      border: `1px solid ${color}30`,
                      color,
                    }}
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>

            {/* Wallet */}
            <div style={{ flexShrink: 0 }}>
              <ConnectWallet {...wallet} />
            </div>
          </div>
        </header>

        {/* ── Wallet not connected ──────────────────────────────── */}
        {!publicKey && !connecting && (
          <div
            className="card"
            style={{
              padding: 32,
              textAlign: 'center',
              background: 'rgba(14,165,233,0.03)',
              border: '1px dashed rgba(14,165,233,0.2)',
            }}
          >
            <div style={{ fontSize: 44, marginBottom: 12 }}>🔗</div>
            <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
              Connect your wallet to get started
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 340, margin: '0 auto 16px', lineHeight: 1.65 }}>
              Use the <strong style={{ color: 'var(--sky-300)' }}>Freighter</strong> browser extension on Stellar Testnet
              to register beneficiaries, verify conditions, and release funds.
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              No wallet?{' '}
              <a
                href="https://freighter.app"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--sky-400)', textDecoration: 'none', fontWeight: 600 }}
              >
                Install Freighter ↗
              </a>{' '}
              and switch it to <strong>Test Net</strong>.
            </p>
          </div>
        )}

        {/* ── Connected: quick actions ──────────────────────────── */}
        {publicKey && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 10,
              padding: '12px 16px',
              background: 'rgba(14,165,233,0.05)',
              border: '1px solid rgba(14,165,233,0.12)',
              borderRadius: 'var(--radius)',
              marginBottom: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: 'var(--emerald-400)',
                boxShadow: '0 0 8px var(--emerald-400)',
                display: 'inline-block',
              }} />
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                {isAdmin ? (
                  <>
                    <span style={{
                      padding: '2px 8px', borderRadius: 99, fontSize: 10,
                      background: 'rgba(14,165,233,0.15)', border: '1px solid rgba(14,165,233,0.3)',
                      color: 'var(--sky-400)', fontWeight: 700, textTransform: 'uppercase',
                      letterSpacing: '0.06em', marginRight: 6,
                    }}>Admin</span>
                    Programme Administrator · Stellar Testnet
                  </>
                ) : (
                  'Connected · Stellar Testnet'
                )}
              </span>
            </div>
            <FundAccount publicKey={publicKey} onFunded={refresh} />
          </div>
        )}

        {/* ── Connected: Balances ──────────────────────────────── */}
        {publicKey && (
          <BalanceCard publicKey={publicKey} refreshKey={refreshKey} />
        )}

        {/* ── CCT Panel ─────────────────────────────────────────── */}
        <CctPanel publicKey={publicKey} />

        {/* ── How Stellar is used ────────────────────────────────── */}
        <div
          className="card"
          style={{ marginTop: 28, padding: 24 }}
        >
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 16 }}>
            Why Stellar?
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            {[
              {
                icon: '⚡',
                title: 'Soroban Smart Contracts',
                body: 'Programmable conditional logic — funds release only when conditions are met, enforced by code.',
              },
              {
                icon: '🔍',
                title: 'Transparent Fund Trail',
                body: 'Every registration, verification, and release is an immutable on-chain event — auditable by anyone.',
              },
              {
                icon: '💰',
                title: 'Near-Zero Fees',
                body: 'Stellar\'s low fees make micro-grants to thousands of beneficiaries economically viable.',
              },
            ].map(({ icon, title, body }) => (
              <div
                key={title}
                style={{
                  padding: 16,
                  background: 'rgba(14,165,233,0.04)',
                  border: '1px solid rgba(14,165,233,0.1)',
                  borderRadius: 'var(--radius)',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ fontSize: 22, marginBottom: 8 }}>{icon}</div>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>{body}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Footer ────────────────────────────────────────────── */}
        <footer style={{ marginTop: 36, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 4 }}>
            <span style={{
              display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
              background: 'var(--sky-500)', boxShadow: '0 0 6px var(--sky-500)',
            }} />
            Built for the StellarX PH Workshop @ PUP QC
          </div>
          <p>
            Project 2: Conditional Cash Transfer System ·{' '}
            <a
              href="https://stellar.expert/explorer/testnet"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--sky-600)', textDecoration: 'none' }}
            >
              Testnet Explorer ↗
            </a>
          </p>
        </footer>
      </div>
    </main>
  );
}
