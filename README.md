# StellarCCT

Corruption-resistant government cash grants that release only when school attendance or health visits are confirmed.

## Problem
Government conditional cash transfer (CCT) programmes suffer from significant corruption and leakage at every stage of the distribution chain. Funds are siphoned off before reaching intended beneficiaries, records are manipulated, and there is no transparent audit trail. The result: the poorest families receive less than what was allocated, while middlemen extract value.

## How It Works
1. An admin (government agency) registers a beneficiary using their Stellar wallet address and specifies a required condition (e.g. School Attendance) along with the grant amount.
2. The beneficiary's condition is verified (e.g., school marks attendance), updating the application status.
3. Once verified, the admin releases the funds, which triggers a real XLM payment directly to the beneficiary's wallet, creating an immutable on-chain record.

## How It Uses Stellar
Stellar testnet payments are used for immediate, near-zero-fee transfers directly to the beneficiary, bypassing traditional corruptible middlemen. The application also supports the integration of Soroban smart contracts to enforce the conditional logic natively on-chain, ensuring funds can only be released after an on-chain verification event.

## Track
Track 5 Social Impact

## Tech Stack
- Framework: Next.js 16 + React + Tailwind CSS
- Stellar SDK: @stellar/stellar-sdk
- Network: Stellar testnet
- Other dependencies: @stellar/freighter-api

## Setup & Run
To run the web interface with testnet payments enabled:

```bash
git clone https://github.com/[your-github-username]/project1.git
cd project1/web
npm install
npm run dev
```

Open `http://localhost:3000` to access the dashboard. Connect with Freighter on Testnet to act as an admin, register beneficiaries, and release XLM.

*(Optional) To deploy the Soroban smart contract component (requires Rust and Stellar CLI):*
```bash
# from the root folder
.\scripts\deploy.ps1
```
Restart `npm run dev` after deployment.

## Network Details
- Network: testnet
- RPC URL: https://soroban-testnet.stellar.org
- Contract IDs: N/A
- Asset issuers: N/A

## Team
- [Your Name] — @[your-github-username]

## License
MIT
