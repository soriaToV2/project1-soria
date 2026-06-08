import {
  TransactionBuilder,
  Operation,
  Asset,
  BASE_FEE,
} from '@stellar/stellar-sdk';
import { server, NETWORK_PASSPHRASE, USDC_ISSUER } from './stellar';

export type AssetCode = 'XLM' | 'USDC';

/** Build an unsigned classic payment transaction and return its XDR. */
export async function buildPaymentXDR(
  sender: string,
  destination: string,
  amount: string,
  assetCode: AssetCode,
): Promise<string> {
  const asset =
    assetCode === 'XLM' ? Asset.native() : new Asset('USDC', USDC_ISSUER);

  // Ensure amount is a string with max 7 decimal places (Stellar SDK requirement)
  const amountStr = Number(parseFloat(amount).toFixed(7)).toString();

  // Always load the account fresh so we have the current sequence number.
  const account = await server.getAccount(sender);

  // Check if destination exists
  let destinationExists = true;
  try {
    await server.getAccount(destination);
  } catch (e: unknown) {
    const status = (e as { response?: { status?: number } })?.response?.status;
    const msg = (e as Error)?.message || '';
    if (status === 404 || (e as { name?: string })?.name === 'NotFoundError' || msg.includes('Account not found') || msg.includes('not found')) {
      destinationExists = false;
    }
  }

  const txBuilder = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  });

  if (!destinationExists) {
    if (assetCode !== 'XLM') {
      throw new Error('Destination account does not exist. Must use XLM to fund new accounts.');
    }
    txBuilder.addOperation(Operation.createAccount({
      destination,
      startingBalance: amountStr,
    }));
  } else {
    txBuilder.addOperation(Operation.payment({
      destination,
      asset,
      amount: amountStr,
    }));
  }

  const tx = txBuilder.setTimeout(60).build();

  return tx.toXDR();
}

/** Submit a Freighter-signed XDR. Returns the transaction hash. */
export async function submitSignedXDR(signedXdr: string): Promise<string> {
  const tx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);
  const res = await server.sendTransaction(tx);
  if (res.status === 'ERROR') {
    throw new Error(`Submit rejected: ${JSON.stringify(res.errorResult ?? res)}`);
  }
  return res.hash;
}

/**
 * Poll until the transaction reaches finality.
 * `sendTransaction` returning PENDING is NOT success — you must poll.
 */
export async function pollTransaction(hash: string): Promise<void> {
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    const res = await server.getTransaction(hash);
    if (res.status !== 'NOT_FOUND') {
      if (res.status === 'SUCCESS') return;
      throw new Error(`Transaction ${res.status}`);
    }
  }
  throw new Error('Transaction timed out after 60s');
}
