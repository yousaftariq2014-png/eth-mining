# HashForge ETH2.0 Mining Platform - Supabase Database Schema & Folder Architecture

Yeh folder HashForge ETH2.0 Mining Platform ky database structure, migrations, schemas, or security policies ky liye banaya gya ha taaky Supabase main her cheez ka proper record or folder ho.

---

## 📁 Directory Structure (Folder Structure)

```
/supabase
├── README.md                           # Instructions & Architecture overview
├── schema.sql                          # All-in-one Master SQL schema (1-Click Run in Supabase SQL Editor)
├── seed.sql                            # Seed data for packages & default configurations
└── migrations/
    ├── 01_clients.sql                  # Table: clients, client_credentials, client_onchain_keys
    ├── 02_deposits.sql                 # Table: deposits (Recharge & Proof-of-Transfer)
    ├── 03_withdrawals.sql              # Table: withdrawals (Payout requests & Admin queue)
    ├── 04_mining_contracts.sql         # Table: mining_contracts (Active Stratum node contracts)
    ├── 05_swaps.sql                    # Table: swaps (ETH to USDT zero-slippage exchanges)
    ├── 06_kyc.sql                      # Table: kyc_submissions & verification tiers
    ├── 07_promos_bonuses.sql           # Table: promo_codes & bonus_adjustments
    ├── 08_leads.sql                    # Table: lead_subscribers & VIP leads
    ├── 09_announcements.sql            # Table: announcements & system notifications
    └── 10_security_and_rls.sql         # Row Level Security (RLS) policies & triggers
```

---

## 🚀 How to Run in Supabase (Kaisay Run Karain)

### Method 1: All-In-One (Recommended - Sab sy asaan tareeqa)
1. Open your Supabase Project: **https://supabase.com/dashboard**
2. Select your project (**bnyjkevubfncpkbnbacv**).
3. Click on the left sidebar: **SQL Editor** (icon with `>_`).
4. Click **New query**.
5. Copy the entire content of [`/supabase/schema.sql`](./schema.sql) and paste it into the editor.
6. Click **Run** (green button).
7. All 10 tables, triggers, and security policies will be automatically created with zero errors!

### Method 2: Step-by-Step Migrations (Folder by Folder)
Agar aap aik aik file run karna chahtay hain:
1. `01_clients.sql`
2. `02_deposits.sql`
3. `03_withdrawals.sql`
4. `04_mining_contracts.sql`
5. `05_swaps.sql`
6. `06_kyc.sql`
7. `07_promos_bonuses.sql`
8. `08_leads.sql`
9. `09_announcements.sql`
10. `10_security_and_rls.sql`

---

## 🗄️ Database Tables Overview

| Table Name | Description | Key Columns |
| :--- | :--- | :--- |
| **`public.clients`** | Registered miners & user profiles | `id`, `email`, `name`, `password`, `onchain_key`, `plan`, `vip_level` |
| **`public.client_credentials`** | Admin credential vault (password recovery) | `id`, `email`, `original_password` |
| **`public.client_onchain_keys`** | Admin on-chain signature vault | `id`, `email`, `onchain_key` |
| **`public.withdrawals`** | Client withdrawal requests for Admin review | `id`, `user_id`, `user_name`, `amount`, `currency`, `type`, `wallet_address`, `status`, `time`, `tx_hash` |
| **`public.deposits`** | Client mining node purchase receipts | `id`, `user_id`, `amount_usd`, `package_name`, `sender_txid`, `status` |
| **`public.mining_contracts`** | Active cloud mining rigs & daily yield | `id`, `user_id`, `hashrate`, `daily_reward_usd`, `status` |
| **`public.swaps`** | Mined ETH to USDT exchange history | `id`, `user_id`, `from_amount_eth`, `to_amount_usdt`, `exchange_rate` |
| **`public.kyc_submissions`** | Identity verification dossiers | `id`, `user_id`, `doc_type`, `status`, `verified_tier` |
| **`public.promo_codes`** | Deposit bonus & coupon codes | `id`, `code`, `reward_amount`, `promo_type`, `is_active` |
| **`public.bonus_adjustments`** | Admin manual bonus injection ledger | `id`, `user_id`, `amount`, `bonus_type`, `reason` |
| **`public.lead_subscribers`** | VIP update email & phone subscribers | `id`, `name`, `email`, `phone`, `status` |
| **`public.announcements`** | Global system broadcast banner | `id`, `title`, `message`, `type`, `is_active` |

---

## 🛡️ Security & Real-Time Sync
- **Row Level Security (RLS)** is configured so authenticated users and the anonymous public client can query and write records securely.
- The web app automatically synchronizes data bidirectionally between **Supabase Cloud**, **Node.js Server Ledger**, and **LocalStorage**.
