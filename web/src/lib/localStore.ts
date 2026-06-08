/**
 * Local (localStorage) beneficiary store for the CCT demo.
 *
 * In production this state would live in the Soroban contract.
 * For the demo we persist to localStorage so data survives page refreshes
 * without requiring a deployed contract.
 */

export type ConditionType = 'SchoolAttendance' | 'HealthVisit';
export type TransferStatus = 'Pending' | 'ConditionVerified' | 'FundsReleased';

export interface Beneficiary {
  address: string;       // Stellar G… address
  name: string;
  conditionType: ConditionType;
  status: TransferStatus;
  allocatedAmount: number; // XLM amount specified by admin to send
  verifiedAt: number;    // Date.now() timestamp, 0 if not yet
  releasedAt: number;    // Date.now() timestamp, 0 if not yet
  txHash: string;        // on-chain payment tx hash once released
  grantAmount: number;   // XLM amount released
}

const KEY = 'stellarcct_beneficiaries_v1';

export function loadBeneficiaries(): Beneficiary[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Beneficiary[]) : [];
  } catch {
    return [];
  }
}

export function saveBeneficiaries(list: Beneficiary[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function addBeneficiary(b: Omit<Beneficiary, 'status' | 'verifiedAt' | 'releasedAt' | 'txHash' | 'grantAmount'>): Beneficiary[] {
  const list = loadBeneficiaries();
  if (list.some((x) => x.address === b.address)) {
    throw new Error('This address is already registered.');
  }
  const next: Beneficiary = {
    ...b,
    status: 'Pending',
    verifiedAt: 0,
    releasedAt: 0,
    txHash: '',
    grantAmount: 0,
  };
  const updated = [...list, next];
  saveBeneficiaries(updated);
  return updated;
}

export function verifyBeneficiary(address: string): Beneficiary[] {
  const list = loadBeneficiaries();
  const updated = list.map((b) => {
    if (b.address !== address) return b;
    if (b.status !== 'Pending') throw new Error('Condition already verified.');
    return { ...b, status: 'ConditionVerified' as TransferStatus, verifiedAt: Date.now() };
  });
  if (!updated.some((b) => b.address === address)) throw new Error('Beneficiary not found.');
  saveBeneficiaries(updated);
  return updated;
}

export function markFundsReleased(address: string, txHash: string, grantAmount: number): Beneficiary[] {
  const list = loadBeneficiaries();
  const updated = list.map((b) => {
    if (b.address !== address) return b;
    if (b.status !== 'ConditionVerified') throw new Error('Condition not yet verified.');
    return {
      ...b,
      status: 'FundsReleased' as TransferStatus,
      releasedAt: Date.now(),
      txHash,
      grantAmount,
    };
  });
  saveBeneficiaries(updated);
  return updated;
}

export function getStats(list: Beneficiary[]) {
  return {
    total_registered: list.length,
    total_verified: list.filter((b) => b.status !== 'Pending').length,
    total_released: list.filter((b) => b.status === 'FundsReleased').length,
  };
}
