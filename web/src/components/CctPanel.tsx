'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  loadBeneficiaries,
  addBeneficiary,
  verifyBeneficiary,
  markFundsReleased,
  getStats,
  type Beneficiary,
  type ConditionType,
  type TransferStatus,
} from '@/lib/localStore';
import { buildPaymentXDR, submitSignedXDR, pollTransaction } from '@/lib/payment';
import { NETWORK_PASSPHRASE, ADMIN_ADDRESS } from '@/lib/stellar';

// ── admin check ──────────────────────────────────────────────────
function isAdminKey(publicKey: string | null): boolean {
  if (!publicKey) return false;
  if (ADMIN_ADDRESS) return publicKey === ADMIN_ADDRESS;
  return true; // dev fallback
}

// ── helpers ──────────────────────────────────────────────────────
function shortAddr(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-6)}`;
}

function fmtTime(ts: number) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString();
}

// ── Status badge ─────────────────────────────────────────────────
function StatusBadge({ status }: { status: TransferStatus }) {
  if (status === 'FundsReleased')
    return (
      <span className="badge badge-released">
        <svg width="9" height="9" viewBox="0 0 16 16" fill="currentColor">
          <path d="M13.5 2.5l-7 8-3-3-1.5 1.5 4.5 4.5 8.5-9.5z" />
        </svg>
        Released
      </span>
    );
  if (status === 'ConditionVerified')
    return (
      <span className="badge badge-verified">
        <svg width="9" height="9" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M3 8l4 4 6-7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Verified
      </span>
    );
  return (
    <span className="badge badge-pending">
      <svg width="9" height="9" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="8" cy="8" r="6" />
        <path d="M8 5v3l2 1.5" strokeLinecap="round" />
      </svg>
      Pending
    </span>
  );
}

// ── Condition chip ────────────────────────────────────────────────
function ConditionChip({ type }: { type: ConditionType }) {
  return type === 'SchoolAttendance'
    ? <span className="chip chip-school">🎓 School</span>
    : <span className="chip chip-health">🏥 Health</span>;
}

// ── Step indicator ────────────────────────────────────────────────
function StepDot({ state }: { state: 'done' | 'active' | 'idle' }) {
  return (
    <div
      className={`step-dot step-dot-${state}`}
      style={{ width: 22, height: 22, fontSize: 10 }}
    >
      {state === 'done' ? '✓' : state === 'active' ? '●' : '○'}
    </div>
  );
}

// ── Stats panel ───────────────────────────────────────────────────
function StatsPanel({ list }: { list: Beneficiary[] }) {
  const stats = getStats(list);
  const pct = stats.total_registered > 0
    ? Math.round((stats.total_released / stats.total_registered) * 100)
    : 0;
  const totalReleased = list
    .filter((b) => b.status === 'FundsReleased')
    .reduce((s, b) => s + b.grantAmount, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="grid-3">
        {[
          { label: 'Registered', value: stats.total_registered, color: 'var(--sky-400)' },
          { label: 'Verified', value: stats.total_verified, color: 'var(--teal-400)' },
          { label: 'Released', value: stats.total_released, color: 'var(--emerald-400)' },
        ].map(({ label, value, color }) => (
          <div key={label} className="stat-card">
            <div style={{ fontSize: 30, fontWeight: 800, color, fontFamily: 'Space Grotesk, sans-serif' }}>
              {value}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Funds Released</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: pct === 100 ? 'var(--emerald-400)' : 'var(--sky-400)' }}>
            {pct}%
          </span>
        </div>
        <div className="progress-track">
          <div
            className={`progress-fill${pct === 100 ? ' progress-fill-success' : ''}`}
            style={{ width: `${Math.max(pct, 2)}%` }}
          />
        </div>
      </div>

      {/* Total XLM released */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 14px',
        background: 'rgba(16,185,129,0.06)',
        border: '1px solid rgba(16,185,129,0.15)',
        borderRadius: 'var(--radius)',
      }}>
        <span style={{ fontSize: 18 }}>💸</span>
        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          Total XLM transferred on-chain:{' '}
          <strong style={{ color: 'var(--emerald-400)' }}>{totalReleased} XLM</strong>
        </span>
      </div>

      {/* Grant info */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 14px',
        background: 'rgba(14,165,233,0.06)',
        border: '1px solid rgba(14,165,233,0.14)',
        borderRadius: 'var(--radius)',
      }}>
        <span style={{ fontSize: 18 }}>ℹ️</span>
        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          Grants are specified per beneficiary when registering, and sent as a real Stellar testnet payment.
        </span>
      </div>
    </div>
  );
}

// ── Beneficiary card ──────────────────────────────────────────────
function BeneficiaryCard({
  b,
  publicKey,
  isAdmin,
  onUpdate,
}: {
  b: Beneficiary;
  publicKey: string | null;
  isAdmin: boolean;
  onUpdate: (list: Beneficiary[]) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [releaseAmount, setReleaseAmount] = useState(String(b.allocatedAmount || 10));

  const doVerify = async () => {
    setBusy(true); setMsg(''); setErr('');
    try {
      const updated = verifyBeneficiary(b.address);
      setMsg('✓ Condition verified on-chain record.');
      onUpdate(updated);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Verification failed');
    } finally {
      setBusy(false);
    }
  };

  const doRelease = async () => {
    if (!publicKey) return;
    setBusy(true); setMsg(''); setErr('');
    try {
      const amountNum = parseFloat(releaseAmount);
      if (isNaN(amountNum) || amountNum <= 0) {
        throw new Error('Invalid release amount.');
      }

      // Build a real XLM payment to the beneficiary's wallet
      const xdr = await buildPaymentXDR(
        publicKey,
        b.address,
        String(amountNum),
        'XLM',
      );

      // Sign with Freighter
      const freighter = await import('@stellar/freighter-api');
      const signed = await freighter.signTransaction(xdr, {
        networkPassphrase: NETWORK_PASSPHRASE,
        address: publicKey,
      });
      if (signed.error) throw new Error(String(signed.error));

      // Submit + poll
      const hash = await submitSignedXDR(signed.signedTxXdr);
      await pollTransaction(hash);

      // Update local store
      const updated = markFundsReleased(b.address, hash, amountNum);
      setMsg(`💸 ${amountNum} XLM sent! Tx: ${hash.slice(0, 14)}…`);
      onUpdate(updated);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Release failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="beneficiary-item animate-fade-in">
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: 14 }}>{b.name}</span>
            <ConditionChip type={b.conditionType} />
          </div>
          <div
            className="mono"
            style={{ color: 'var(--text-muted)', marginTop: 3, wordBreak: 'break-all', fontSize: 11 }}
          >
            {b.address}
          </div>
        </div>
        <StatusBadge status={b.status} />
      </div>

      {/* Steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 4 }}>
        {/* Step 1 */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <StepDot state="done" />
          <div>
            <span style={{ fontSize: 12, fontWeight: 600 }}>Registered</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6 }}>Beneficiary added to programme</span>
          </div>
        </div>
        {/* Step 2 */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <StepDot state={b.status !== 'Pending' ? 'done' : 'active'} />
          <div>
            <span style={{ fontSize: 12, fontWeight: 600, color: b.status !== 'Pending' ? undefined : 'var(--sky-400)' }}>
              Condition Verified
            </span>
            {b.verifiedAt ? (
              <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6 }}>
                {fmtTime(b.verifiedAt)}
              </span>
            ) : (
              <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6 }}>
                Awaiting confirmation
              </span>
            )}
          </div>
        </div>
        {/* Step 3 */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <StepDot state={b.status === 'FundsReleased' ? 'done' : b.status === 'ConditionVerified' ? 'active' : 'idle'} />
          <div>
            <span style={{
              fontSize: 12, fontWeight: 600,
              color: b.status === 'FundsReleased' ? 'var(--emerald-400)' : b.status === 'ConditionVerified' ? 'var(--sky-400)' : 'var(--text-muted)',
            }}>
              Funds Released
            </span>
            {b.txHash ? (
              <a
                href={`https://stellar.expert/explorer/testnet/tx/${b.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 11, color: 'var(--sky-500)', marginLeft: 6, textDecoration: 'none' }}
              >
                {b.txHash.slice(0, 12)}… ↗
              </a>
            ) : (
              <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6 }}>
                {b.status === 'ConditionVerified' ? 'Ready to release' : 'Pending verification'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Admin action buttons */}
      {isAdmin && (
        <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
          {b.status === 'Pending' && (
            <button
              id={`btn-verify-${b.address.slice(0, 8)}`}
              onClick={doVerify}
              disabled={busy}
              className="btn btn-primary"
              style={{ fontSize: 12, padding: '7px 14px' }}
            >
              {busy ? <><span className="spinner" /> Working…</> : '✓ Verify Condition'}
            </button>
          )}
          {b.status === 'ConditionVerified' && (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input
                type="number"
                min="1"
                step="1"
                value={releaseAmount}
                onChange={(e) => setReleaseAmount(e.target.value)}
                disabled={busy || !publicKey}
                className="input"
                style={{ width: 80, padding: '5px 10px', height: 32, fontSize: 13 }}
                title="Amount of XLM to send"
              />
              <button
                id={`btn-release-${b.address.slice(0, 8)}`}
                onClick={doRelease}
                disabled={busy || !publicKey || !releaseAmount}
                className="btn btn-success"
                style={{ fontSize: 12, padding: '7px 14px', height: 32 }}
              >
                {busy
                  ? <><span className="spinner" /> Sending…</>
                  : `💸 Release XLM`}
              </button>
            </div>
          )}
          {b.status === 'FundsReleased' && (
            <span style={{ fontSize: 12, color: 'var(--emerald-400)', padding: '7px 0' }}>
              ✓ {b.grantAmount} XLM sent to beneficiary
            </span>
          )}
        </div>
      )}

      {msg && <p className="alert alert-success" style={{ fontSize: 12 }}>{msg}</p>}
      {err && <p className="alert alert-error" style={{ fontSize: 12 }}>{err}</p>}
    </div>
  );
}

// ── Register form ─────────────────────────────────────────────────
function RegisterForm({
  publicKey,
  onRegistered,
}: {
  publicKey: string;
  onRegistered: (list: Beneficiary[]) => void;
}) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [allocatedAmount, setAllocatedAmount] = useState('10');
  const [conditionType, setConditionType] = useState<ConditionType>('SchoolAttendance');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !address.trim()) return;
    setBusy(true); setMsg(''); setErr('');
    try {
      if (!address.trim().startsWith('G') || address.trim().length !== 56) {
        throw new Error('Invalid Stellar address. Must be 56 characters starting with G.');
      }
      const amountNum = parseFloat(allocatedAmount);
      if (isNaN(amountNum) || amountNum <= 0) {
        throw new Error('Please enter a valid grant amount greater than 0.');
      }
      const updated = addBeneficiary({
        name: name.trim(),
        address: address.trim(),
        conditionType,
        allocatedAmount: amountNum,
      });
      setMsg(`Beneficiary "${name.trim()}" registered!`);
      setName(''); setAddress('');
      onRegistered(updated);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Registration failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <label className="label" htmlFor="input-ben-name">Beneficiary Name</label>
        <input
          id="input-ben-name"
          className="input"
          type="text"
          placeholder="e.g. Maria Santos"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="label" htmlFor="input-ben-addr">Stellar Wallet Address</label>
        <input
          id="input-ben-addr"
          className="input mono"
          type="text"
          placeholder="G… (56 characters)"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          required
        />
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
          This is the wallet that will receive the XLM grant.
        </p>
      </div>
      <div>
        <label className="label" htmlFor="input-ben-amount">XLM Grant Amount</label>
        <input
          id="input-ben-amount"
          className="input"
          type="number"
          min="1"
          step="1"
          value={allocatedAmount}
          onChange={(e) => setAllocatedAmount(e.target.value)}
          required
        />
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
          Amount of XLM to release to the beneficiary when conditions are met.
        </p>
      </div>
      <div>
        <label className="label" htmlFor="select-condition">Condition Required</label>
        <select
          id="select-condition"
          className="input"
          value={conditionType}
          onChange={(e) => setConditionType(e.target.value as ConditionType)}
        >
          <option value="SchoolAttendance">🎓 School Attendance</option>
          <option value="HealthVisit">🏥 Health Visit</option>
        </select>
      </div>
      <button
        id="btn-register"
        type="submit"
        disabled={busy || !name.trim() || !address.trim()}
        className="btn btn-teal"
      >
        {busy ? <><span className="spinner" /> Registering…</> : '➕ Register Beneficiary'}
      </button>
      {msg && <p className="alert alert-success" style={{ fontSize: 13 }}>{msg}</p>}
      {err && <p className="alert alert-error" style={{ fontSize: 13 }}>{err}</p>}
    </form>
  );
}

// ── Main CCT Panel ────────────────────────────────────────────────
export default function CctPanel({ publicKey }: { publicKey: string | null }) {
  const isAdmin = isAdminKey(publicKey);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [tab, setTab] = useState<'overview' | 'beneficiaries' | 'register'>('overview');

  // Load from localStorage on mount
  useEffect(() => {
    setBeneficiaries(loadBeneficiaries());
  }, []);

  const handleUpdate = useCallback((updated: Beneficiary[]) => {
    setBeneficiaries(updated);
  }, []);

  const tabs: { id: 'overview' | 'beneficiaries' | 'register'; label: string; disabled?: boolean }[] = [
    { id: 'overview', label: '📊 Overview' },
    { id: 'beneficiaries', label: `👥 Beneficiaries (${beneficiaries.length})` },
    { id: 'register', label: '➕ Register', disabled: !isAdmin },
  ];

  return (
    <div className="card panel-glow" style={{ marginTop: 32 }}>
      {/* Header */}
      <div style={{ padding: '20px 24px 0', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: 'linear-gradient(135deg, var(--sky-500), var(--teal-500))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, flexShrink: 0,
          }}>
            🏦
          </div>
          <div>
            <h2 className="section-header" style={{ fontSize: 17 }}>CCT Dashboard</h2>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
              Real XLM transfers · Conditional logic · Stellar Testnet
            </p>
          </div>
          {isAdmin && (
            <span style={{
              marginLeft: 'auto',
              padding: '3px 10px', borderRadius: 99, fontSize: 10,
              background: 'rgba(14,165,233,0.15)', border: '1px solid rgba(14,165,233,0.3)',
              color: 'var(--sky-400)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
            }}>
              Admin
            </span>
          )}
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex' }}>
          {tabs.map((t) => (
            <button
              key={t.id}
              id={`tab-${t.id}`}
              onClick={() => !t.disabled && setTab(t.id)}
              disabled={t.disabled}
              style={{
                background: 'none', border: 'none',
                padding: '10px 16px', fontSize: 13, fontWeight: 600,
                cursor: t.disabled ? 'not-allowed' : 'pointer',
                color: tab === t.id ? 'var(--sky-400)' : 'var(--text-muted)',
                borderBottom: tab === t.id ? '2px solid var(--sky-400)' : '2px solid transparent',
                transition: 'all 0.18s',
                opacity: t.disabled ? 0.4 : 1,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div style={{ padding: '20px 24px 24px' }}>

        {/* ── Overview ── */}
        {tab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <StatsPanel list={beneficiaries} />

            {/* How it works */}
            <div>
              <p className="label" style={{ marginBottom: 12 }}>How it works</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'Admin registers beneficiary', sub: 'Name, Stellar wallet address, and condition type saved', done: true },
                  { label: 'Condition verified', sub: 'School attendance or health visit confirmed by programme officer', done: true },
                  { label: 'XLM sent directly to beneficiary wallet', sub: 'A real Stellar payment — no middlemen, no leakage', done: true },
                ].map(({ label, sub, done }, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <StepDot state={done ? 'done' : 'idle'} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{label}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {beneficiaries.length === 0 && (
              <div className="alert alert-info">
                <span>No beneficiaries yet.{' '}
                  {isAdmin
                    ? <button onClick={() => setTab('register')} style={{ background: 'none', border: 'none', color: 'var(--sky-400)', fontWeight: 700, cursor: 'pointer', padding: 0 }}>Register the first one →</button>
                    : 'Connect as admin to register beneficiaries.'}
                </span>
              </div>
            )}
          </div>
        )}

        {/* ── Beneficiaries ── */}
        {tab === 'beneficiaries' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {!publicKey && (
              <div className="alert alert-warning">
                Connect your wallet to manage beneficiaries (verify conditions and release funds).
              </div>
            )}
            {beneficiaries.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>👥</div>
                <p style={{ fontSize: 14 }}>No beneficiaries registered yet.</p>
                {isAdmin && (
                  <button
                    onClick={() => setTab('register')}
                    className="btn btn-primary"
                    style={{ marginTop: 12 }}
                  >
                    Register first beneficiary
                  </button>
                )}
              </div>
            ) : (
              beneficiaries.map((b) => (
                <BeneficiaryCard
                  key={b.address}
                  b={b}
                  publicKey={publicKey}
                  isAdmin={isAdmin}
                  onUpdate={handleUpdate}
                />
              ))
            )}
          </div>
        )}

        {/* ── Register ── */}
        {tab === 'register' && isAdmin && publicKey && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="alert alert-info">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
              </svg>
              <span>
                Acting as <strong>admin</strong>{' '}
                (<span className="mono" style={{ fontSize: 11 }}>{shortAddr(publicKey)}</span>).
                Specify the beneficiary's Stellar wallet and the XLM grant amount they will receive.
              </span>
            </div>
            <RegisterForm
              publicKey={publicKey}
              onRegistered={(updated) => { handleUpdate(updated); setTab('beneficiaries'); }}
            />
          </div>
        )}

        {tab === 'register' && !isAdmin && (
          <div className="alert alert-error">
            Only the programme admin can register beneficiaries.
          </div>
        )}
      </div>
    </div>
  );
}
