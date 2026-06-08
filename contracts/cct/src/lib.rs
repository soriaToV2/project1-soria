#![no_std]
//! Conditional Cash Transfer (CCT) — Soroban contract for the StellarX PUP workshop.
//!
//! The government (admin) registers beneficiaries and allocates funds.
//! Funds are released only when an authorized verifier confirms that
//! the beneficiary has met a condition (school attendance or health visit).
//!
//! Functions:
//!  - `init(admin, grant_amount)` — Initialize with admin and per-beneficiary grant amount.
//!  - `register_beneficiary(caller, beneficiary, name)` — Admin registers a beneficiary.
//!  - `verify_condition(caller, beneficiary, condition_type)` — Verifier attests condition met.
//!  - `release_funds(caller, beneficiary)` — Trigger fund release (recorded on-chain).
//!  - `get_beneficiary(beneficiary)` — Read beneficiary state.
//!  - `get_stats()` — Read aggregate stats.

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short,
    Address, Env, String,
};

/// Type of condition that must be verified before funds release.
#[contracttype]
#[derive(Clone, PartialEq)]
pub enum ConditionType {
    SchoolAttendance,
    HealthVisit,
}

/// Status of a beneficiary's transfer.
#[contracttype]
#[derive(Clone, PartialEq)]
pub enum TransferStatus {
    Pending,
    ConditionVerified,
    FundsReleased,
}

/// Per-beneficiary state stored in contract.
#[contracttype]
#[derive(Clone)]
pub struct Beneficiary {
    pub name: String,
    pub condition_verified: bool,
    pub funds_released: bool,
    pub condition_type: ConditionType,
    pub status: TransferStatus,
    pub verified_at_ledger: u32,
    pub released_at_ledger: u32,
}

/// Aggregate statistics for the dashboard.
#[contracttype]
#[derive(Clone)]
pub struct Stats {
    pub total_registered: i128,
    pub total_verified: i128,
    pub total_released: i128,
    pub grant_amount: i128,
}

/// Storage keys.
#[contracttype]
pub enum DataKey {
    Admin,
    GrantAmount,
    Beneficiary(Address),
    TotalRegistered,
    TotalVerified,
    TotalReleased,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    Unauthorized = 3,
    BeneficiaryNotFound = 4,
    ConditionAlreadyVerified = 5,
    FundsAlreadyReleased = 6,
    ConditionNotYetVerified = 7,
    BeneficiaryAlreadyRegistered = 8,
}

#[contract]
pub struct CctContract;

#[contractimpl]
impl CctContract {
    /// Initialize the contract with an admin address and per-beneficiary grant amount.
    pub fn init(env: Env, admin: Address, grant_amount: i128) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::AlreadyInitialized);
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::GrantAmount, &grant_amount);
        env.storage().instance().set(&DataKey::TotalRegistered, &0i128);
        env.storage().instance().set(&DataKey::TotalVerified, &0i128);
        env.storage().instance().set(&DataKey::TotalReleased, &0i128);
        env.storage().instance().extend_ttl(1000, 10000);
        Ok(())
    }

    /// Register a new beneficiary (admin only).
    pub fn register_beneficiary(
        env: Env,
        caller: Address,
        beneficiary: Address,
        name: String,
        condition_type: ConditionType,
    ) -> Result<(), Error> {
        if !env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::NotInitialized);
        }
        caller.require_auth();
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        if caller != admin {
            return Err(Error::Unauthorized);
        }
        let key = DataKey::Beneficiary(beneficiary.clone());
        if env.storage().persistent().has(&key) {
            return Err(Error::BeneficiaryAlreadyRegistered);
        }
        let b = Beneficiary {
            name,
            condition_verified: false,
            funds_released: false,
            condition_type,
            status: TransferStatus::Pending,
            verified_at_ledger: 0,
            released_at_ledger: 0,
        };
        env.storage().persistent().set(&key, &b);
        env.storage().persistent().extend_ttl(&key, 1000, 10000);

        let total: i128 = env.storage().instance().get(&DataKey::TotalRegistered).unwrap_or(0);
        env.storage().instance().set(&DataKey::TotalRegistered, &(total + 1));
        env.storage().instance().extend_ttl(1000, 10000);

        env.events().publish(
            (symbol_short!("register"),),
            (beneficiary,),
        );
        Ok(())
    }

    /// Verify that a beneficiary met their condition (admin/verifier only).
    pub fn verify_condition(
        env: Env,
        caller: Address,
        beneficiary: Address,
    ) -> Result<(), Error> {
        if !env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::NotInitialized);
        }
        caller.require_auth();
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        if caller != admin {
            return Err(Error::Unauthorized);
        }
        let key = DataKey::Beneficiary(beneficiary.clone());
        let mut b: Beneficiary = env
            .storage()
            .persistent()
            .get(&key)
            .ok_or(Error::BeneficiaryNotFound)?;
        if b.condition_verified {
            return Err(Error::ConditionAlreadyVerified);
        }
        b.condition_verified = true;
        b.status = TransferStatus::ConditionVerified;
        b.verified_at_ledger = env.ledger().sequence();
        env.storage().persistent().set(&key, &b);
        env.storage().persistent().extend_ttl(&key, 1000, 10000);

        let total: i128 = env.storage().instance().get(&DataKey::TotalVerified).unwrap_or(0);
        env.storage().instance().set(&DataKey::TotalVerified, &(total + 1));
        env.storage().instance().extend_ttl(1000, 10000);

        env.events().publish(
            (symbol_short!("verify"),),
            (beneficiary,),
        );
        Ok(())
    }

    /// Release funds to a verified beneficiary (admin only).
    pub fn release_funds(
        env: Env,
        caller: Address,
        beneficiary: Address,
    ) -> Result<i128, Error> {
        if !env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::NotInitialized);
        }
        caller.require_auth();
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        if caller != admin {
            return Err(Error::Unauthorized);
        }
        let key = DataKey::Beneficiary(beneficiary.clone());
        let mut b: Beneficiary = env
            .storage()
            .persistent()
            .get(&key)
            .ok_or(Error::BeneficiaryNotFound)?;
        if !b.condition_verified {
            return Err(Error::ConditionNotYetVerified);
        }
        if b.funds_released {
            return Err(Error::FundsAlreadyReleased);
        }
        b.funds_released = true;
        b.status = TransferStatus::FundsReleased;
        b.released_at_ledger = env.ledger().sequence();
        env.storage().persistent().set(&key, &b);
        env.storage().persistent().extend_ttl(&key, 1000, 10000);

        let grant: i128 = env.storage().instance().get(&DataKey::GrantAmount).unwrap_or(0);
        let total: i128 = env.storage().instance().get(&DataKey::TotalReleased).unwrap_or(0);
        env.storage().instance().set(&DataKey::TotalReleased, &(total + 1));
        env.storage().instance().extend_ttl(1000, 10000);

        env.events().publish(
            (symbol_short!("release"),),
            (beneficiary, grant),
        );
        Ok(grant)
    }

    /// Read a single beneficiary's state.
    pub fn get_beneficiary(env: Env, beneficiary: Address) -> Result<Beneficiary, Error> {
        let key = DataKey::Beneficiary(beneficiary);
        env.storage()
            .persistent()
            .get(&key)
            .ok_or(Error::BeneficiaryNotFound)
    }

    /// Read aggregate stats.
    pub fn get_stats(env: Env) -> Stats {
        Stats {
            total_registered: env.storage().instance().get(&DataKey::TotalRegistered).unwrap_or(0),
            total_verified: env.storage().instance().get(&DataKey::TotalVerified).unwrap_or(0),
            total_released: env.storage().instance().get(&DataKey::TotalReleased).unwrap_or(0),
            grant_amount: env.storage().instance().get(&DataKey::GrantAmount).unwrap_or(0),
        }
    }
}
