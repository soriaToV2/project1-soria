# Deploy the CCT (Conditional Cash Transfer) Soroban contract to Stellar testnet,
# then write the contract ID into web\.env.local so the frontend can call it.
#
# Prereqs: Rust + wasm32v1-none target, and the Stellar CLI (`stellar --version`).
#
# Usage:  .\scripts\deploy.ps1 [identityName]   (default identity: workshop)

param([string]$Identity = "workshop")

$ErrorActionPreference = "Stop"
$Network   = "testnet"
$Root      = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$Wasm      = "target\wasm32v1-none\release\cct.wasm"
$EnvFile   = Join-Path $Root "web\.env.local"

Set-Location $Root

# 1. Ensure a funded testnet identity exists
$keys = stellar keys ls
if ($keys -notcontains $Identity) {
  Write-Host "Creating + funding testnet identity '$Identity'..."
  stellar keys generate $Identity --network $Network --fund
}

$AdminAddr = (stellar keys address $Identity).Trim()
Write-Host "Admin address: $AdminAddr"

# 2. Build all contracts in the workspace (including cct)
Write-Host "Building contracts..."
stellar contract build

# 3. Deploy CCT contract to testnet
Write-Host "Deploying CCT to $Network..."
$ContractId = (stellar contract deploy --wasm $Wasm --source-account $Identity --network $Network).Trim()
Write-Host "Deployed contract ID: $ContractId"

# 4. Initialise CCT (grant_amount = 100 XLM per beneficiary). Skip if already done.
Write-Host "Initialising CCT (grant_amount 100 XLM)..."
try {
  stellar contract invoke `
    --id $ContractId --source-account $Identity --network $Network `
    -- init --admin $AdminAddr --grant_amount 100
} catch {
  Write-Host "(init skipped — contract may already be initialised)"
}

# 5. Write env vars into web\.env.local
if (Test-Path $EnvFile) {
  (Get-Content $EnvFile) |
    Where-Object { $_ -notmatch '^NEXT_PUBLIC_CONTRACT_ID=' } |
    Set-Content $EnvFile
}
Add-Content $EnvFile "NEXT_PUBLIC_CONTRACT_ID=$ContractId"

Write-Host ""
Write-Host "Wrote NEXT_PUBLIC_CONTRACT_ID=$ContractId to web\.env.local"
Write-Host "Restart 'npm run dev' to pick up the new contract ID."
