import {
  Contract,
  TransactionBuilder,
  BASE_FEE,
  Account,
  rpc,
  nativeToScVal,
  scValToNative,
  Address,
  xdr,
} from '@stellar/stellar-sdk';
import { server, NETWORK_PASSPHRASE, CONTRACT_ID } from './stellar';

// Funded testnet account for read-only simulations (Circle USDC issuer).
const READ_SOURCE = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';

export type ConditionType = 'SchoolAttendance' | 'HealthVisit';
export type TransferStatus = 'Pending' | 'ConditionVerified' | 'FundsReleased';

export interface BeneficiaryState {
  name: string;
  condition_verified: boolean;
  funds_released: boolean;
  condition_type: ConditionType;
  status: TransferStatus;
  verified_at_ledger: number;
  released_at_ledger: number;
}

export interface CctStats {
  total_registered: number;
  total_verified: number;
  total_released: number;
  grant_amount: number;
}

export function contractConfigured(): boolean {
  return Boolean(CONTRACT_ID);
}

function buildSimSource(): Account {
  return new Account(READ_SOURCE, '0');
}

/** Read aggregate stats via simulation — no wallet needed. */
export async function readCctStats(): Promise<CctStats> {
  const contract = new Contract(CONTRACT_ID);
  const source = buildSimSource();

  const tx = new TransactionBuilder(source, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call('get_stats'))
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (!rpc.Api.isSimulationSuccess(sim) || !sim.result) {
    throw new Error('Could not read contract stats. Is the CCT contract deployed and initialised?');
  }

  const raw = scValToNative(sim.result.retval) as {
    total_registered: bigint;
    total_verified: bigint;
    total_released: bigint;
    grant_amount: bigint;
  };

  return {
    total_registered: Number(raw.total_registered),
    total_verified: Number(raw.total_verified),
    total_released: Number(raw.total_released),
    grant_amount: Number(raw.grant_amount),
  };
}

/** Read a specific beneficiary's state via simulation. */
export async function readBeneficiary(beneficiaryAddress: string): Promise<BeneficiaryState> {
  const contract = new Contract(CONTRACT_ID);
  const source = buildSimSource();

  const tx = new TransactionBuilder(source, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      contract.call(
        'get_beneficiary',
        new Address(beneficiaryAddress).toScVal(),
      ),
    )
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (!rpc.Api.isSimulationSuccess(sim) || !sim.result) {
    throw new Error('Beneficiary not found or contract not deployed.');
  }

  const raw = scValToNative(sim.result.retval) as Record<string, unknown>;
  return parseBeneficiary(raw);
}

function parseBeneficiary(raw: Record<string, unknown>): BeneficiaryState {
  // condition_type comes back as an object { tag: 'SchoolAttendance' } or similar
  let condition_type: ConditionType = 'SchoolAttendance';
  const ct = raw.condition_type;
  if (typeof ct === 'string') {
    condition_type = ct as ConditionType;
  } else if (ct && typeof ct === 'object' && 'tag' in ct) {
    condition_type = (ct as { tag: string }).tag as ConditionType;
  } else if (ct && typeof ct === 'object') {
    // Map index-based enum: 0 = SchoolAttendance, 1 = HealthVisit
    const keys = Object.keys(ct as object);
    if (keys[0] === '0') condition_type = 'SchoolAttendance';
    else condition_type = 'HealthVisit';
  }

  let status: TransferStatus = 'Pending';
  const st = raw.status;
  if (typeof st === 'string') {
    status = st as TransferStatus;
  } else if (st && typeof st === 'object' && 'tag' in st) {
    status = (st as { tag: string }).tag as TransferStatus;
  }

  return {
    name: String(raw.name ?? ''),
    condition_verified: Boolean(raw.condition_verified),
    funds_released: Boolean(raw.funds_released),
    condition_type,
    status,
    verified_at_ledger: Number(raw.verified_at_ledger ?? 0),
    released_at_ledger: Number(raw.released_at_ledger ?? 0),
  };
}

/**
 * Build + simulate + assemble `register_beneficiary(caller, beneficiary, name, condition_type)`.
 */
export async function buildRegisterBeneficiaryXDR(
  caller: string,
  beneficiary: string,
  name: string,
  conditionType: ConditionType,
): Promise<string> {
  const contract = new Contract(CONTRACT_ID);
  const account = await server.getAccount(caller);

  const conditionScVal =
    conditionType === 'SchoolAttendance'
      ? xdr.ScVal.scvVec([xdr.ScVal.scvSymbol('SchoolAttendance')])
      : xdr.ScVal.scvVec([xdr.ScVal.scvSymbol('HealthVisit')]);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      contract.call(
        'register_beneficiary',
        new Address(caller).toScVal(),
        new Address(beneficiary).toScVal(),
        nativeToScVal(name, { type: 'string' }),
        conditionScVal,
      ),
    )
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (!rpc.Api.isSimulationSuccess(sim)) {
    const errMsg = rpc.Api.isSimulationError(sim)
      ? sim.error
      : 'Simulation failed — register_beneficiary would not succeed.';
    throw new Error(errMsg);
  }

  return rpc.assembleTransaction(tx, sim).build().toXDR();
}

/**
 * Build + simulate + assemble `verify_condition(caller, beneficiary)`.
 */
export async function buildVerifyConditionXDR(
  caller: string,
  beneficiary: string,
): Promise<string> {
  const contract = new Contract(CONTRACT_ID);
  const account = await server.getAccount(caller);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      contract.call(
        'verify_condition',
        new Address(caller).toScVal(),
        new Address(beneficiary).toScVal(),
      ),
    )
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (!rpc.Api.isSimulationSuccess(sim)) {
    const errMsg = rpc.Api.isSimulationError(sim)
      ? sim.error
      : 'Simulation failed — verify_condition would not succeed.';
    throw new Error(errMsg);
  }

  return rpc.assembleTransaction(tx, sim).build().toXDR();
}

/**
 * Build + simulate + assemble `release_funds(caller, beneficiary)`.
 */
export async function buildReleaseFundsXDR(
  caller: string,
  beneficiary: string,
): Promise<string> {
  const contract = new Contract(CONTRACT_ID);
  const account = await server.getAccount(caller);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      contract.call(
        'release_funds',
        new Address(caller).toScVal(),
        new Address(beneficiary).toScVal(),
      ),
    )
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (!rpc.Api.isSimulationSuccess(sim)) {
    const errMsg = rpc.Api.isSimulationError(sim)
      ? sim.error
      : 'Simulation failed — release_funds would not succeed.';
    throw new Error(errMsg);
  }

  return rpc.assembleTransaction(tx, sim).build().toXDR();
}
