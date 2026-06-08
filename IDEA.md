# StellarCCT — Conditional Cash Transfer System

## Idea
- **Track:** Social Impact
- **Idea # (from the 300-ideas list):** Project 2
- **One-liner:** Corruption-resistant government cash grants that release on-chain only when school attendance or health visits are confirmed.

## Problem

Government conditional cash transfer (CCT) programmes — like the Philippines' 4Ps (Pantawid Pamilyang Pilipino Program) — suffer from significant corruption and leakage at every stage of the distribution chain. Funds are siphoned off before reaching intended beneficiaries, records are manipulated, and there is no transparent audit trail. The result: the poorest families receive less than what was allocated, while middlemen extract value.

## How it uses Stellar

All three Stellar primitives are **core** to the solution:

| Stellar Feature | Role in CCT |
|---|---|
| **Soroban smart contract** | Enforces the conditional logic — funds can only be marked "released" after an on-chain condition verification. No contract = no release. |
| **On-chain events** | Every `register`, `verify`, and `release` action emits an immutable event — a public, tamper-proof audit trail. |
| **Stellar testnet payments** | The grant amount is recorded in the contract state; real XLM/USDC transfers use Stellar's near-zero-fee payment rails. |
| **Freighter wallet** | The admin (government agency) signs all state-changing transactions — no server-side private keys. |

## What works in the demo
- [x] Connect wallet (Freighter, testnet)
- [x] Fund account via Friendbot
- [x] Register a beneficiary (name, wallet address, condition type) — on-chain Soroban call
- [x] Verify condition (school attendance / health visit) — on-chain state change with ledger timestamp
- [x] Release funds — contract enforces that condition must be verified first
- [x] Live stats dashboard (registered / verified / released counts + grant amount)
- [x] Beneficiary look-up by Stellar address
- [x] Step-by-step transfer trail per beneficiary with ledger number proof

## Setup / run

**Prerequisites:** Node.js ≥ 18, Rust + `wasm32v1-none` target, Stellar CLI

```bash
# Frontend
cd web && npm install && npm run dev
```

**Deploy the contract (optional — stats panel shows placeholder if not deployed):**
```powershell
.\scripts\deploy.ps1
# Then restart npm run dev
```

**Environment variables (auto-set by deploy.ps1):**
```
NEXT_PUBLIC_CONTRACT_ID=<your-contract-id>
```

## Demo
- 2–4 min video link: _(record after testnet deploy)_
- Public repo link: _(add after making public)_

## Submission checklist
- [x] Public GitHub repo with MIT license
- [x] README explains problem, Stellar usage, and setup
- [ ] Demo video (2–4 min)
- [ ] Submitted via the workshop's official GitHub issue template
