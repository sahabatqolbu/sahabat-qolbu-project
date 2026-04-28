# Sahabat Qolbu Database Review, Redesign, and Docker Migration Plan

## 0. Deployment context - read this before project work

This project is being prepared for production deployment first. Payment expansion is intentionally frozen for now; keep existing payment regression tests green, but do not add new payment scope until production is stable. The near-term product direction after deployment is document automation for the admin team.

Primary deployment risk to keep in mind: `backend/drizzle.config.js` writes migrations to `backend/drizzle/migrations`. The workspace now removes the old `drizzle/` ignore rule and adds migration guards, but production schema must still be reproduced from committed migrations, not from `db:push` or the runtime compatibility patch.

### Milestone 1 - CI all green

Status: **Completed in workspace on 2026-04-27**

Goal: every current repository gate should pass before deployment work continues.

- [x] Fix backend governance scripts so they read docs from `docs/`:
  - `backend/src/scripts/runbookComplianceCheck.js`
  - `backend/src/scripts/apiContractComplianceCheck.js`
  - `backend/src/scripts/piiGovernanceCheck.js`
- [x] Fix `dashboard/src/scripts/check-menu-routes.mjs` so it validates routes in both `src/app/(dashboard)` and `src/app/(mobile)`.
- [x] Fix menu route drift: `Paket Saya` now points to `/jamaah/packages`.
- [x] Clean dashboard lint until `cd dashboard && npm run lint` passes.
- [x] Keep these checks green:
  - `cd backend && npm test`
  - `cd backend && npm run check:runbook`
  - `cd backend && npm run check:api-contract`
  - `cd backend && npm run check:pii-governance`
  - `cd dashboard && npm run test:menu-routes`
  - `cd dashboard && npm run lint && npm run build`
  - `cd frontend && npm run lint && npm run build`

### Milestone 2 - database deploy strategy

Status: **Completed in workspace on 2026-04-27**

Goal: production database changes are explicit, reviewable, and repeatable.

- [x] Remove the `drizzle/` ignore rule from `backend/.gitignore`.
- [x] Add `npm run check:migrations` guard so CI fails if migration SQL/meta are missing or ignored.
- [x] Add `npm run db:migrate` for reviewed migration execution.
- [x] Add migration compliance check to backend deploy workflow before deploy.
- [x] Make `backend/drizzle/migrations/**` and `backend/drizzle/migrations/meta/**` visible to git. They are now untracked in this workspace and must be staged/committed with the deploy-readiness changes.
- [x] Generate explicit reconciliation migration `backend/drizzle/migrations/0009_tidy_bastion.sql` for schema changes that were previously covered by runtime compatibility patching.
- [x] Do not use `drizzle-kit push` as the production deployment strategy. `npm run db:push` now fails intentionally; local disposable DB push is `npm run db:push:dev`.
- [x] Production migration flow is documented in `docs/DEPLOYMENT_RUNBOOK.md`: backup DB, run reviewed migration SQL with `npm run db:migrate`, verify app health and critical queries.
- [x] Keep `ENABLE_RUNTIME_SCHEMA_PATCH` unset or `false` in production; `npm run check:prod-env` fails if it is enabled.
- [x] Treat `ensureSchemaCompatibility()` as emergency-only; production requires `ALLOW_PROD_RUNTIME_SCHEMA_PATCH=true` if someone intentionally overrides it after backup/approval.
- [x] Define DB integration tests on a test/staging DB as a required pre-production gate: `ENABLE_DB_INTEGRATION_TESTS=true npm run test:db-integration`.

### Milestone 3 - deploy-ready infrastructure

Status: **In Progress**

Goal: backend, dashboard, and frontend can run safely in production-like config.

- [x] Finalize backend env template and guard: DB credentials, `JWT_SECRET`, trusted CORS origins, cookie security, SMTP, backend/dashboard/frontend URLs.
- [x] Add `npm run check:prod-env` so production env can be validated before restart/deploy.
- [x] Make backend CORS read `CORS_ORIGINS` in addition to `FRONTEND_URL` and `DASHBOARD_URL`.
- [x] Finalize dashboard/frontend env templates: API URL, app URLs, and matching dashboard `JWT_SECRET`.
- [x] Add `.gitignore` exceptions so `dashboard/.env.example` and `frontend/.env.example` are visible to git.
- [ ] Confirm cPanel backend runtime/process management and restart procedure.
- [x] Treat `backend/public/uploads` as runtime storage, not source code deploy content; `.cpanel.yml` now excludes `.env*`, `node_modules/`, `public/uploads/`, and `backups/` from rsync deploy.
- [ ] Smoke test locally/staging:
  - `GET /health`
  - `GET /api/v1/public/packages`
  - `GET /api/v1/public/agents/slugs`
  - `GET /api/v1/docs` returns `403 SECURITY_DOCS_DISABLED`
  - login + OTP manual sanity
  - protected upload access sanity

### Milestone 4 - production deploy and rollback

Status: **Blocked until production credentials, cPanel process details, Vercel project/env confirmation, and staging DB smoke are available**

Goal: first production deployment can be verified and reversed.

- Backup DB before deploy.
- Backup uploads before deploy.
- Deploy backend to cPanel.
- Deploy dashboard and frontend to Vercel.
- Run production smoke checks.
- Record deploy evidence: commit, timestamp, environment, executor, smoke results.
- Keep a rollback path ready: previous code artifact plus DB/upload restore procedure.

### Milestone 5 - document automation v1

Status: **Planned after production is stable**

Goal: after production is stable, reduce admin document workload.

- Normalize jamaah documents into a row-based `jamaah_documents` model.
- Add dashboard document tracker: complete, incomplete, rejected, expired, and reupload-needed states.
- Preserve least-privilege document access for ADMIN, STAFF, FINANCE, AGEN, and JAMAAH.
- Add reminder flow for missing documents, H-45/H-30 deadlines, and rejected reuploads.
- Add exports for admin work: manifest, document checklist, Excel/PDF recap.

### Current verification log - 2026-04-27

Passed in this workspace:

- `cd backend && npm run check:migrations`
- `cd backend && npm run check:runbook`
- `cd backend && npm run check:api-contract`
- `cd backend && npm run check:pii-governance`
- `cd backend && npm test` (48 passed, 4 DB integration cases skipped because staging/test DB is not enabled)
- `cd backend && npm run check:prod-env` with safe dummy production env values
- `cd backend && npm run db:push` guard check (expected failure path confirmed)
- `cd dashboard && npm run test:menu-routes`
- `cd dashboard && npm run lint` (passes with legacy warnings)
- `cd dashboard && npm run build`
- `cd frontend && npm run lint`
- `cd frontend && npm run build`

Still required before production:

- Stage/commit `backend/drizzle/migrations/**` and `backend/drizzle/migrations/meta/**` with the deploy-readiness changes.
- Run `ENABLE_DB_INTEGRATION_TESTS=true npm run test:db-integration` against a staging/test MySQL database.
- Run `npm run smoke` against staging/production backend with `SMOKE_BASE_URL` and, ideally, `SMOKE_AUTH_COOKIE`.
- Confirm cPanel Node.js process/restart details and Vercel project/env values.
- Take DB and uploads backups immediately before production deploy.

## 1. Project review

### 1.1 Repository structure

```text
sahabat-qolbu-project/
├─ backend/            # Express API + Drizzle + MySQL
│  ├─ src/
│  │  ├─ app.js
│  │  ├─ controllers/
│  │  ├─ routes/
│  │  ├─ db/
│  │  │  ├─ index.js
│  │  │  ├─ schema.js
│  │  │  ├─ relations.js
│  │  │  └─ seeds/
│  │  ├─ middlewares/
│  │  ├─ tests/
│  │  └─ scripts/
│  ├─ drizzle/
│  │  └─ migrations/
│  ├─ drizzle.config.js
│  ├─ package.json
│  └─ .env.example
├─ dashboard/          # Internal dashboard (Next.js App Router)
│  ├─ src/app/
│  │  ├─ (dashboard)/
│  │  └─ (mobile)/
│  ├─ next.config.ts
│  └─ package.json
├─ frontend/           # Public marketing site (Next.js App Router)
│  ├─ src/app/
│  │  ├─ (marketing)/
│  │  └─ [namaagen]/
│  ├─ next.config.ts
│  └─ package.json
├─ docs/               # Internal docs and operating docs
├─ scripts/            # Repo-level scripts
└─ README.md
```

### 1.2 Tech stack

| Area | Stack | Evidence |
| --- | --- | --- |
| Backend API | Node.js, Express 5, Drizzle ORM, MySQL2, Zod, JWT, Nodemailer, Multer | `backend/package.json`, `backend/src/app.js`, `backend/src/db/index.js` |
| Dashboard | Next.js 16 App Router, React 19, TypeScript, TanStack Query, Zustand, Radix UI, Tailwind CSS 4 | `dashboard/package.json`, `dashboard/src/app/` |
| Public frontend | Next.js 16 App Router, React 19, TypeScript, TanStack Query, Framer Motion, Next SEO | `frontend/package.json`, `frontend/src/app/` |
| Database | MySQL via Drizzle `mysql` dialect | `backend/drizzle.config.js`, `backend/src/db/index.js` |
| Migration tooling | Drizzle SQL migrations | `backend/drizzle/migrations/` |
| Automated DB validation | Node built-in test runner with DB-backed integration tests | `backend/src/tests/integration-db-critical.test.js` |

### 1.3 Main config files reviewed

| File | Purpose |
| --- | --- |
| `README.md` | Monorepo architecture, setup, runtime expectations |
| `backend/package.json` | Backend scripts, dependencies, Drizzle commands |
| `backend/drizzle.config.js` | Drizzle schema path, migration output path, DB credentials source |
| `backend/.env.example` | Expected DB/env variables |
| `backend/src/db/index.js` | MySQL pool + Drizzle init + emergency-only runtime schema patch guard |
| `backend/src/db/schema.js` | Current authoritative application schema |
| `backend/src/db/relations.js` | ORM-level relationships |
| `backend/drizzle/migrations/*.sql` | Schema evolution history |
| `dashboard/package.json` / `dashboard/next.config.ts` | Dashboard runtime and route design |
| `frontend/package.json` / `frontend/next.config.ts` | Public frontend runtime |

### 1.4 Current database wiring

- The backend connects to MySQL using `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME` from env.
- Drizzle uses `backend/src/db/schema.js` and writes SQL migrations to `backend/drizzle/migrations/`.
- The backend creates its own MySQL pool in `backend/src/db/index.js`.
- Pool size now uses `DB_POOL_MAX` with a low shared-hosting default of `5`, and idle timeout uses `DB_POOL_IDLE_TIMEOUT`.
- There is no project-level `docker-compose.yml` yet.
- The app still contains `ensureSchemaCompatibility()`, but it is disabled by default and production requires an explicit emergency override. The current compatibility changes are now represented by `0009_tidy_bastion.sql`.

### 1.5 Current core entities

#### Core auth / access

- `users`
- Single-role auth model via enum: `ADMIN`, `FINANCE`, `STAFF`, `AGEN`, `JAMAAH`

#### Package / reference data

- `packages`
- `package_images`
- `package_itinerary`
- `master_hotels`
- `master_airlines`
- `master_airports`
- `master_banks`
- `master_documents`
- `company_profile`

#### Jamaah domain

- `jamaah_data`
- `jamaah_payments`
- `transactions`
- `payment_installments`

#### Agent domain

- `agen_profiles`
- `agen_transactions`
- `agent_data`
- `agent_levels`
- `agent_benefits`
- `agent_requirements`
- `agent_purposes`
- `periods`
- `agent_payment_transactions`
- `agent_closing_history`
- `agent_star_history`

#### Content / operations

- `notifications`
- `calendar_events`
- `audit_logs`
- `faqs`
- `gallery`
- `testimonials`
- `itikaf_programs`
- `itikaf_participants`

### 1.6 Relationship summary today

```text
users
├─ jamaah_data (via user_id)
├─ agent_data (via user_id)
├─ notifications
└─ audit_logs

packages
├─ package_images
├─ package_itinerary
├─ jamaah_data
└─ calendar_events

jamaah_data
├─ jamaah_payments
├─ transactions
└─ agent_closing_history

agent_data
├─ agent_levels
├─ agent_payment_transactions
├─ agent_closing_history
└─ agent_star_history
```

### 1.7 Migration history themes found

| Migration | Main change |
| --- | --- |
| `0000_material_namorita.sql` | Initial core schema including `users`, `packages`, `jamaah_data`, `transactions`, `payment_installments`, `jamaah_documents` |
| `0001_polite_ghost_rider.sql` | Added `package_images` and `package_itinerary` |
| `0002_redundant_the_hunter.sql` | Added content tables (`faqs`, `gallery`, `testimonials`) |
| `0003_amused_stature.sql` | Major redesign of `jamaah_data`, added `jamaah_payments`, dropped some old uniqueness constraints |
| `0004_broad_dorian_gray.sql` | Re-added fields and FKs, widened `jamaah_data`, dropped obsolete columns |
| `0005_brief_maginty.sql` | Dropped `jamaah_documents`, moved more document fields directly onto `jamaah_data` |
| `0006_solid_ser_duncan.sql` | Added agent program tables, changed package types, added `STAFF` role, approval columns |
| `0007_superb_rumiko_fujikawa.sql` | Extended notification types |
| `0008_tense_hobgoblin.sql` | Added `calendar_events` |
| `0009_tidy_bastion.sql` | Reconciled runtime patch drift into reviewed SQL: notification enum additions, agent media fields, payment proof/rejection fields, `users.created_by`, and supporting indexes/FKs |

---

## 2. Current state summary

### 2.1 Main problems and inefficiencies

#### 1. Schema drift between code, migrations, and runtime

Evidence:

- `backend/src/db/index.js` still contains emergency `ALTER TABLE` / `CREATE INDEX` compatibility logic.
- `backend/drizzle/migrations/0009_tidy_bastion.sql` now covers the current compatibility changes, so the remaining goal is to keep production on migration SQL and retire the runtime patch later.

Why this matters:

- Production must keep using reviewed migration SQL so new environments reproduce the same schema.
- Runtime patching remains a risk if someone enables it outside an emergency.
- Docker/staging rehearsal is still required because an existing DB may already have some of these patch columns from an older runtime.

#### 2. `jamaah_data` mixes too many responsibilities

`jamaah_data` currently combines:

- user/profile identity
- booking record
- package selection
- pricing snapshot
- payment summary
- approval workflow
- document URLs

Impact:

- hard to support multiple bookings per user cleanly
- hard to validate documents separately from booking lifecycle
- hard to reconcile financial data
- every new document type requires schema change

#### 3. The code already behaves like one user can have multiple jamaah rows

Evidence:

- `jamaahSelfController` reads the latest `jamaah_data` row by `user_id`, ordered by `updatedAt` / `id`, instead of relying on a unique 1:1 row.

Impact:

- current model is conceptually many-bookings-per-user, but schema still stores profile and booking in the same table
- this confirms the need to split profile and booking

#### 4. `jamaah_documents` was normalized, then removed

Evidence:

- `0000_material_namorita.sql` created `jamaah_documents`
- `0005_brief_maginty.sql` dropped it
- current schema stores `foto_url`, `ktp_url`, `kk_url`, `paspor_url`, `buku_nikah_url`, `akta_lahir_url`, `ijazah_url`, `vaksin_url`, `meningitis_url` directly on `jamaah_data`

Impact:

- poor extensibility
- weak auditability and versioning
- duplicated verification logic
- impossible to attach metadata cleanly per upload

#### 5. Payment model is split across overlapping tables

Current payment-related tables:

- `jamaah_payments`
- `transactions`
- `payment_installments`
- rollup fields on `jamaah_data` such as `total_payment`, `outstanding`, and `status_payment`

Impact:

- duplicated sources of truth
- reconciliation complexity
- higher risk of stale totals
- controller logic has to derive status from multiple places

#### 6. Agent data is duplicated between `agen_profiles` and `agent_data`

Both tables store overlapping concepts:

- identity
- referral, status, and level
- bank data
- approval workflow
- document references

Evidence from code:

- current routes and controllers primarily use `agent_data`
- legacy `agen_profiles` still exists in migrations and schema

Impact:

- unclear canonical source
- risk during reporting and migration
- difficult to enforce clean FKs

#### 7. Important foreign keys are still missing or incomplete

Examples that should be enforced at the DB layer but currently are weak or absent:

- `packages.airline_id -> master_airlines.id`
- `packages.hotel_makkah_id -> master_hotels.id`
- `packages.hotel_madinah_id -> master_hotels.id`
- `packages.departure_airport_id -> master_airports.id`
- `package_images.package_id -> packages.id`
- `package_itinerary.package_id -> packages.id`
- `transactions.jamaah_id -> jamaah_data.id` (or future booking table)
- `transactions.package_id -> packages.id`
- `payment_installments.transaction_id -> transactions.id`
- `itikaf_participants.program_id -> itikaf_programs.id`
- `itikaf_participants.user_id -> users.id`
- `audit_logs.user_id -> users.id`
- `jamaah_data.approved_by` / `rejected_by -> users.id`
- `jamaah_payments.rejected_by -> users.id`

#### 8. Several indexes are missing for real workloads

Examples:

- `packages(is_published, is_active, departure_date)`
- `packages(airline_id)`
- `packages(hotel_makkah_id)`
- `packages(hotel_madinah_id)`
- `packages(departure_airport_id)`
- `package_itinerary(package_id, day_number)` unique
- `transactions(package_id)`
- `transactions(verified_by)`
- `payment_installments(transaction_id, installment_number)` unique
- `jamaah_payments(verified_by)`, `jamaah_payments(rejected_by)`, `jamaah_payments(payment_date)`
- `jamaah_data(agen_id)`, `jamaah_data(registration_status)`, `jamaah_data(approved_by)`, `jamaah_data(rejected_by)`
- `notifications(user_id, is_read, created_at)` composite

#### 9. Denormalized operational fields in `packages`

`packages` stores:

- airline term 1/2 amounts, dates, statuses
- hotel room counts as many columns
- facilities as text

Impact:

- wide table with mixed concerns
- future changes need more columns
- hard to query and report consistently

#### 10. Text and JSON-like fields should be modeled more intentionally

Current examples:

- hotel facilities stored as `text`
- package facilities stored as `text`
- agent purposes and requirements stored as JSON arrays in some places

Recommendation:

- use proper MySQL `JSON` type for display-only structured data
- use join tables when the data is relational and queryable

#### 11. Pooling and config need staging-specific tuning before Docker

Evidence:

- `DB_POOL_MAX` and `DB_POOL_IDLE_TIMEOUT` are now wired, with a shared-hosting default
- Docker/staging values still need to be chosen during rehearsal

Impact:

- local Docker, staging, and production can now be tuned, but the target values should be validated under realistic load

#### 12. Secrets hygiene needs improvement around env usage

- The repo has env templates and local env files.
- Docker migration should avoid copying real secrets into tracked compose files.
- Compose env should come from a non-committed file.

### 2.2 Current-state conclusion

The database works, but the current shape shows two distinct generations of design:

1. an older, more normalized model with tables like `jamaah_documents`
2. a newer, more delivery-driven model that pushed multiple responsibilities into `jamaah_data` and layered runtime compatibility patches on top

Before moving to Docker permanently, the schema should be stabilized so environment migration does not also become schema archaeology.

---

## 3. Proposed new structure

### 3.1 Design principles

1. Separate **person/profile** data from **booking/trip** data.
2. Restore **normalized document storage**.
3. Merge duplicated agent tables into **one canonical agent profile** model.
4. Keep finance data in **one clear flow**: invoice, schedule, receipt.
5. Add DB-level foreign keys for real integrity, not only ORM relations.
6. Use additive migrations first and avoid destructive cutover until validation is complete.
7. Stop using runtime schema patching as the normal way to evolve schema.

### 3.2 Recommended canonical tables

## A. Identity and access

| Table | Key fields | Constraints / notes |
| --- | --- | --- |
| `users` | `id`, `email`, `password_hash`, `role`, `full_name`, `phone`, `created_by_user_id`, `otp_code`, `otp_expires_at`, `is_active`, `is_email_verified`, `last_login_at`, `created_at`, `updated_at` | Keep as auth table. `UNIQUE(email)`. FK `created_by_user_id -> users.id`. Index `(role, is_active)`. |

Notes:

- Keeping role as enum is acceptable because the app currently uses a fixed set of roles.
- Rename `password` to `password_hash` in the new schema for clarity.

## B. Reference / master data

| Table | Key fields | Constraints / notes |
| --- | --- | --- |
| `master_hotels` | `id`, `name`, `city`, `address`, `star_rating`, `distance_to_haram`, `facilities_json`, `image_url`, `is_active`, timestamps | Add unique key if hotel names must be unique per city. Use `JSON` instead of plain text for facilities. |
| `master_airlines` | `id`, `code`, `name`, `logo`, `country`, `is_active`, timestamps | `UNIQUE(code)` |
| `master_airports` | `id`, `code`, `name`, `city`, `country`, `is_active`, timestamps | `UNIQUE(code)` |
| `company_bank_accounts` | `id`, `bank_name`, `account_number`, `account_name`, `branch`, `is_active`, timestamps | Better name than `master_banks`, because the table stores company accounts, not a global bank catalog. |
| `master_documents` | `id`, `code`, `name`, `description`, `category`, `is_mandatory`, `allowed_formats_json`, `max_size_mb`, `is_active`, timestamps | Add stable `code` so document logic does not depend on display names. |
| `company_profile` | keep current shape | Fine as a singleton config table. |

## C. Packages and travel operations

| Table | Key fields | Constraints / notes |
| --- | --- | --- |
| `packages` | `id`, `code`, `name`, `description`, `type`, `departure_date`, `return_date`, `duration_days`, `base_price`, `discount_price`, `total_seats`, `is_active`, `is_published`, `airline_id`, `hotel_makkah_id`, `hotel_madinah_id`, `departure_airport_id`, `facilities_json`, `notes`, `itinerary_pdf`, timestamps | `UNIQUE(code)`. Add FKs to airline, hotel, and airport masters. Add index `(is_published, is_active, departure_date)`. |
| `package_images` | `id`, `package_id`, `image_url`, `caption`, `sort_order`, `is_primary`, timestamps | FK `package_id -> packages.id`. Add index `(package_id, sort_order)`. |
| `package_itineraries` | `id`, `package_id`, `day_number`, `title`, `description`, `activities_json`, timestamps | FK `package_id -> packages.id`. Add `UNIQUE(package_id, day_number)`. |
| `package_room_allocations` | `id`, `package_id`, `city`, `room_type`, `quota`, timestamps | Replaces `hotel_makkah_double/triple/quad/quint` and `hotel_madinah_double/triple/quad/quint`. |
| `package_vendor_commitments` | `id`, `package_id`, `vendor_type`, `sequence_no`, `amount`, `due_date`, `status`, `notes`, timestamps | Replaces hard-coded airline term columns and future-proofs vendor commitments. |

## D. Jamaah domain

| Table | Key fields | Constraints / notes |
| --- | --- | --- |
| `jamaah_profiles` | `id`, `user_id`, `nama_paspor`, `nik`, `birth_place`, `birth_date`, `gender`, `marital_status`, `address`, `province`, `city`, `district`, `postal_code`, `passport_number`, `passport_issue_date`, `passport_expiry_date`, `passport_issue_place`, `emergency_name`, `emergency_phone`, `emergency_relation`, timestamps | One profile per user: `UNIQUE(user_id)`. `UNIQUE(nik)` and `UNIQUE(passport_number)` when present. |
| `jamaah_bookings` | `id`, `booking_number`, `jamaah_profile_id`, `package_id`, `agent_profile_id`, `booked_at`, `package_option`, `room_type_makkah`, `room_type_madinah`, `quoted_price`, `discount_agent_fee`, `discount_agent_points`, `discount_family_cashback`, `final_price`, `registration_status`, `payment_status`, `approved_at`, `approved_by`, `rejected_at`, `rejected_by`, `rejection_reason`, `notes`, timestamps | One user can have many bookings. `UNIQUE(booking_number)`. This table becomes the lifecycle anchor instead of `jamaah_data`. |
| `jamaah_documents` | `id`, `jamaah_profile_id`, `booking_id`, `document_type_id`, `file_url`, `mime_type`, `file_size_bytes`, `verification_status`, `verified_by`, `verified_at`, `rejected_by`, `rejected_at`, `rejection_reason`, `is_active`, `created_at`, `updated_at` | Restores normalized docs. `booking_id` nullable for docs tied to person rather than trip. |
| `booking_invoices` | `id`, `booking_id`, `invoice_number`, `total_amount`, `commission_amount`, `commission_status`, `status`, `issued_at`, `verified_by`, `verified_at`, `notes`, timestamps | Canonical finance summary at booking level. Repurpose current `transactions` concept here. |
| `booking_installments` | `id`, `invoice_id`, `installment_number`, `due_date`, `amount_due`, `status`, `paid_at`, `notes`, timestamps | Repurpose current `payment_installments`. Add `UNIQUE(invoice_id, installment_number)`. |
| `payment_receipts` | `id`, `booking_id`, `invoice_id`, `installment_id`, `payment_number`, `bank_account_id`, `paid_by`, `payment_date`, `amount`, `proof_url`, `proof_status`, `verified_by`, `verified_at`, `rejected_by`, `rejected_at`, `rejection_reason`, `notes`, timestamps | Canonical proof-upload and payment-receipt table. Maps naturally from current `jamaah_payments`. |

Why this is better for jamaah data:

- personal identity is stored once in `jamaah_profiles`
- each trip and booking gets its own `jamaah_bookings` row
- uploaded documents are extensible and auditable
- payment status becomes a booking concern, not a profile concern
- old summary fields like `total_payment` and `outstanding` can be derived from receipts and invoices instead of treated as hand-maintained truth

## E. Agent domain

| Table | Key fields | Constraints / notes |
| --- | --- | --- |
| `agent_profiles` | `id`, `user_id`, `full_name_ktp`, `nickname`, `nik`, `birth_place`, `birth_date`, `address`, `province`, `city`, `postal_code`, `instagram`, `facebook`, `tiktok`, `youtube`, `landing_logo`, `landing_primary_color`, `landing_accent_color`, `referral_code`, `recruited_by_agent_id`, `current_level_id`, `current_star`, `star_obtained_by`, `certificate_number`, `certificate_file`, `certificate_issue_date`, `certificate_valid_from`, `certificate_valid_until`, `profile_photo`, `ktp_photo`, `payment_proof`, `account_name`, `account_number`, `bank_name`, `status`, `is_complete`, `submitted_at`, `approved_at`, `approved_by`, `rejection_note`, `notes`, timestamps | Merge `agen_profiles` + `agent_data` into one canonical table. `UNIQUE(user_id)`, `UNIQUE(nik)`, `UNIQUE(referral_code)`, `UNIQUE(certificate_number)`. |
| `agent_levels` | keep current shape | Current table is good; keep it. |
| `agent_benefits` | keep current shape | Keep FK cascade to `agent_levels`. |
| `agent_profile_purposes` | `agent_profile_id`, `purpose_id`, `created_at` | Replaces JSON arrays of purpose IDs. |
| `agent_profile_requirements` | `agent_profile_id`, `requirement_id`, `agreed_at` | Replaces JSON arrays of agreed requirement IDs. |
| `agent_transactions` | `id`, `agent_profile_id`, `booking_id`, `referred_agent_id`, `type`, `amount`, `description`, `transaction_date`, `proof_url`, `status`, `verified_by`, `verified_at`, `notes`, timestamps | Keep as the canonical agent ledger, but point to merged `agent_profiles`. |
| `agent_upgrade_payments` | `id`, `agent_profile_id`, `target_star`, `amount`, `payment_date`, `proof_url`, `notes`, timestamps | Renamed form of `agent_payment_transactions`. |
| `agent_closing_history` | `id`, `agent_profile_id`, `booking_id`, `period_id`, `closing_date`, `amount`, `notes`, timestamps | Use booking, not raw `jamaah_data` row, once booking table exists. |
| `agent_star_history` | keep current shape but point to merged `agent_profiles` | Fine structurally. |
| `periods` | keep current shape | Fine structurally. |
| `agent_purposes` / `agent_requirements` | keep current shape | Fine structurally. |

## F. Content and operational tables to keep with improvements

| Table | Recommendation |
| --- | --- |
| `notifications` | Keep; add composite index `(user_id, is_read, created_at)`. |
| `calendar_events` | Keep; current design is acceptable. Add clearer FK usage and maybe `(package_id, start_date)` composite index. |
| `audit_logs` | Keep; add FK to `users`. |
| `faqs`, `gallery`, `testimonials`, `company_profile`, `itikaf_programs`, `itikaf_participants` | Keep; add missing FKs and indexes where absent. |

### 3.3 Foreign keys that should exist in the target schema

| From | To |
| --- | --- |
| `users.created_by_user_id` | `users.id` |
| `packages.airline_id` | `master_airlines.id` |
| `packages.hotel_makkah_id` | `master_hotels.id` |
| `packages.hotel_madinah_id` | `master_hotels.id` |
| `packages.departure_airport_id` | `master_airports.id` |
| `package_images.package_id` | `packages.id` |
| `package_itineraries.package_id` | `packages.id` |
| `package_room_allocations.package_id` | `packages.id` |
| `package_vendor_commitments.package_id` | `packages.id` |
| `jamaah_profiles.user_id` | `users.id` |
| `jamaah_bookings.jamaah_profile_id` | `jamaah_profiles.id` |
| `jamaah_bookings.package_id` | `packages.id` |
| `jamaah_bookings.agent_profile_id` | `agent_profiles.id` |
| `jamaah_bookings.approved_by` / `rejected_by` | `users.id` |
| `jamaah_documents.jamaah_profile_id` | `jamaah_profiles.id` |
| `jamaah_documents.booking_id` | `jamaah_bookings.id` |
| `jamaah_documents.document_type_id` | `master_documents.id` |
| `jamaah_documents.verified_by` / `rejected_by` | `users.id` |
| `booking_invoices.booking_id` | `jamaah_bookings.id` |
| `booking_invoices.verified_by` | `users.id` |
| `booking_installments.invoice_id` | `booking_invoices.id` |
| `payment_receipts.booking_id` | `jamaah_bookings.id` |
| `payment_receipts.invoice_id` | `booking_invoices.id` |
| `payment_receipts.installment_id` | `booking_installments.id` |
| `payment_receipts.bank_account_id` | `company_bank_accounts.id` |
| `payment_receipts.verified_by` / `rejected_by` | `users.id` |
| `agent_profiles.user_id` | `users.id` |
| `agent_profiles.recruited_by_agent_id` | `agent_profiles.id` |
| `agent_profiles.current_level_id` | `agent_levels.id` |
| `agent_profiles.approved_by` | `users.id` |
| `agent_profile_purposes.agent_profile_id` | `agent_profiles.id` |
| `agent_profile_purposes.purpose_id` | `agent_purposes.id` |
| `agent_profile_requirements.agent_profile_id` | `agent_profiles.id` |
| `agent_profile_requirements.requirement_id` | `agent_requirements.id` |
| `agent_transactions.agent_profile_id` | `agent_profiles.id` |
| `agent_transactions.booking_id` | `jamaah_bookings.id` |
| `agent_transactions.referred_agent_id` | `agent_profiles.id` |
| `agent_transactions.verified_by` | `users.id` |
| `agent_upgrade_payments.agent_profile_id` | `agent_profiles.id` |
| `agent_closing_history.agent_profile_id` | `agent_profiles.id` |
| `agent_closing_history.booking_id` | `jamaah_bookings.id` |
| `agent_closing_history.period_id` | `periods.id` |
| `agent_star_history.agent_profile_id` | `agent_profiles.id` |
| `notifications.user_id` | `users.id` |
| `calendar_events.package_id` | `packages.id` |
| `calendar_events.created_by` | `users.id` |
| `audit_logs.user_id` | `users.id` |
| `itikaf_participants.program_id` | `itikaf_programs.id` |
| `itikaf_participants.user_id` | `users.id` |

### 3.4 Indexes to add or change

| Table | Indexes |
| --- | --- |
| `packages` | `(is_published, is_active, departure_date)`, `(airline_id)`, `(hotel_makkah_id)`, `(hotel_madinah_id)`, `(departure_airport_id)` |
| `package_images` | `(package_id, sort_order)` |
| `package_itineraries` | `UNIQUE(package_id, day_number)` |
| `jamaah_profiles` | `UNIQUE(user_id)`, `UNIQUE(nik)`, `UNIQUE(passport_number)` |
| `jamaah_bookings` | `UNIQUE(booking_number)`, `(jamaah_profile_id, created_at)`, `(package_id, registration_status)`, `(agent_profile_id, registration_status)`, `(approved_by)`, `(rejected_by)` |
| `jamaah_documents` | `(jamaah_profile_id, document_type_id)`, `(booking_id)`, `(verification_status)` |
| `booking_invoices` | `UNIQUE(invoice_number)`, `(booking_id)`, `(status)`, `(verified_by)` |
| `booking_installments` | `UNIQUE(invoice_id, installment_number)`, `(due_date, status)` |
| `payment_receipts` | `UNIQUE(booking_id, payment_number)`, `(invoice_id)`, `(installment_id)`, `(proof_status)`, `(payment_date)`, `(verified_by)`, `(rejected_by)` |
| `agent_profiles` | `UNIQUE(user_id)`, `UNIQUE(referral_code)`, `UNIQUE(nik)`, `(status)`, `(current_level_id)`, `(current_star)` |
| `agent_transactions` | `(agent_profile_id, status)`, `(booking_id)`, `(type, status)` |
| `agent_closing_history` | `UNIQUE(agent_profile_id, booking_id, period_id)`, `(period_id)` |
| `notifications` | `(user_id, is_read, created_at)` |
| `calendar_events` | `(package_id, start_date)`, `(type, start_date)` |
| `audit_logs` | `(user_id, created_at)`, `(module, action, created_at)` |

### 3.5 Normalization improvements

1. Split `jamaah_data` into `jamaah_profiles` + `jamaah_bookings`.
2. Restore `jamaah_documents` so document types are rows, not columns.
3. Merge `agen_profiles` and `agent_data` into one `agent_profiles` table.
4. Replace agent purpose and requirement JSON arrays with join tables.
5. Move package room quota columns into `package_room_allocations`.
6. Move package vendor term columns into `package_vendor_commitments`.
7. Treat receipts, invoices, and installments as different finance concepts instead of partially overlapping tables.
8. Replace free-text JSON strings with true `JSON` columns or join tables where relational querying is required.

---

## 4. Safe migration strategy

### 4.1 Guiding approach

Use an **additive, staged migration** with a **short read-only cutover window**.

Why this is the best fit here:

- the schema already has drift
- agent and jamaah models need reshaping, not just column renames
- a long dual-write phase would add a lot of code complexity
- a controlled cutover is safer than trying to keep old and new models live for too long

### 4.2 Migration phases

#### Phase 0 — Baseline and backup

1. Take a full SQL dump from Laragon.
2. Take a second schema-only dump for audit.
3. Export row counts for critical tables.
4. Record current app version and commit hash used for the migration.
5. Create a Docker-based rehearsal database before touching the real working DB.

Suggested validation snapshot tables:

- `users`
- `packages`
- `jamaah_data`
- `jamaah_payments`
- `transactions`
- `payment_installments`
- `agent_data`
- `agen_profiles`
- `agen_transactions`
- `notifications`
- `calendar_events`

#### Phase 1 — Reconcile current schema first

Before redesigning, create a one-time reconciliation migration so that:

- startup no longer needs to patch missing columns
- the Docker copy and current app schema can be reproduced cleanly
- all current columns, indexes, and FKs expected by the app exist explicitly in migrations

This phase should remove the need for `ensureSchemaCompatibility()` as a normal dependency.

#### Phase 2 — Create new canonical tables alongside old ones

Create the new tables without dropping old ones:

- `jamaah_profiles`
- `jamaah_bookings`
- `jamaah_documents`
- `booking_invoices`
- `booking_installments`
- `payment_receipts`
- `agent_profiles`
- `agent_profile_purposes`
- `agent_profile_requirements`
- `package_room_allocations`
- `package_vendor_commitments`
- `company_bank_accounts` (or a controlled rename strategy from `master_banks`)

#### Phase 3 — Backfill master and reference data

- Copy `master_banks` into `company_bank_accounts`.
- Preserve IDs where practical to reduce mapping complexity.
- Add stable document `code` values in `master_documents`.

#### Phase 4 — Backfill jamaah profile and booking data

Mapping rules:

| Old source | New target | Rule |
| --- | --- | --- |
| `jamaah_data.user_id` + personal fields | `jamaah_profiles` | One profile per `user_id`; pick the most complete or latest non-null values if multiple rows exist |
| `jamaah_data.booking_number` + package, pricing, and workflow fields | `jamaah_bookings` | One booking row per old `jamaah_data` row |
| `jamaah_data.approved_by` / `rejected_by` | `jamaah_bookings` | Preserve audit trail |
| `jamaah_data.status_payment` | `jamaah_bookings.payment_status` | Carry forward, then validate against receipts |

Important rule:

- **Do not drop any old totals or statuses until a reconciliation script proves the new derived values match the old values.**

#### Phase 5 — Backfill documents

Pivot the current document URL columns into rows:

- `foto_url` -> document code `FOTO`
- `ktp_url` -> `KTP`
- `kk_url` -> `KK`
- `paspor_url` -> `PASPOR`
- `buku_nikah_url` -> `BUKU_NIKAH`
- `akta_lahir_url` -> `AKTA_LAHIR`
- `ijazah_url` -> `IJAZAH`
- `vaksin_url` -> `VAKSIN`
- `meningitis_url` -> `MENINGITIS`

Store each as a row in `jamaah_documents` with:

- `jamaah_profile_id`
- optional `booking_id`
- `document_type_id`
- `file_url`
- default `verification_status`

#### Phase 6 — Backfill finance data

| Old source | New target | Rule |
| --- | --- | --- |
| `transactions` | `booking_invoices` | Preserve `invoice_number`, totals, commission info, and status |
| `payment_installments` | `booking_installments` | Preserve due dates, amounts, and status |
| `jamaah_payments` | `payment_receipts` | Preserve proof workflow, amount, and verification data |
| `jamaah_data.total_payment/outstanding` | derived validation only | Recompute from receipts and compare; do not trust blindly |

Key decision:

- `payment_receipts` should become the canonical source for uploaded proof events.
- `booking_invoices` should become the canonical source for booking-level financial summary.
- `booking_installments` should become the canonical source for planned due schedule.

#### Phase 7 — Backfill and merge agent data

Mapping strategy:

| Old source | New target | Rule |
| --- | --- | --- |
| `agent_data` | `agent_profiles` | Treat as primary source because current controllers use it most |
| `agen_profiles` | `agent_profiles` | Fill gaps only when `agent_data` is null or empty |
| `agent_payment_transactions` | `agent_upgrade_payments` | Direct map |
| `agen_transactions` | `agent_transactions` | Convert FK to merged `agent_profiles` ID |
| agent purpose JSON arrays | `agent_profile_purposes` | Expand rows |
| agreed requirement JSON arrays | `agent_profile_requirements` | Expand rows |

Conflict handling:

- generate a conflict report for rows where both `agent_data` and `agen_profiles` have different non-null values for the same logical field
- manually review before final cutover

#### Phase 8 — Application switch-over

1. Update Drizzle schema to the new canonical tables.
2. Update controllers and services to read and write only the new tables.
3. Run DB integration tests.
4. Smoke test these flows end-to-end:
   - login + OTP
   - create and update jamaah
   - upload jamaah documents
   - submit jamaah approval and reject flows
   - add payment, reject payment, and verify payment
   - agent profile submit, approve, and reject
   - notifications
   - calendar events

#### Phase 9 — Validation and reconciliation

Required checks before removing old tables:

- row counts match expected mappings
- no orphan rows under new FKs
- all `booking_number` values preserved
- all `invoice_number` values preserved
- receipt sums match old `jamaah_data.total_payment`
- recalculated outstanding matches old outstanding within accepted tolerance
- critical integration tests pass
- sample dashboard pages load without missing relation data

#### Phase 10 — Decommission legacy tables and columns

After one successful release cycle or soak period:

- stop writing old tables
- archive old tables with timestamp suffix if needed
- drop legacy tables and columns:
  - `jamaah_data` (after full replacement)
  - `agen_profiles` (after merge)
  - legacy document URL columns
  - any no-longer-needed payment summary columns

### 4.3 Recommended rollout order

1. Rehearsal in Docker clone.
2. Reconcile current schema.
3. Add new tables.
4. Backfill data.
5. Verify data.
6. Switch code.
7. Run tests and smoke test.
8. Freeze old writes.
9. Remove legacy objects later.

### 4.4 Rollback plan

If cutover fails:

1. Keep the original Laragon dump and pre-cutover snapshot.
2. Point backend back to the old DB connection.
3. Disable the new code path.
4. Re-import the pre-cutover dump if necessary.
5. Keep migration scripts idempotent where possible.

---

## 5. Docker setup plan (Laragon MySQL -> Docker MySQL)

### 5.1 Recommendation

**Recommended image:** `mysql:8.0`

Why:

- the codebase is explicitly built for MySQL
- Drizzle config uses MySQL dialect
- README already assumes MySQL 8+
- `mysql2` + Drizzle are a stable match for MySQL 8

Important note:

- If Laragon is actually using MariaDB rather than MySQL, run a rehearsal import first. If import compatibility is poor, do a temporary same-engine migration first, then upgrade separately.

### 5.2 Recommended Docker strategy

Use Docker only for the database first.

- Keep backend, dashboard, and frontend running on the host initially.
- Move only MySQL into Docker.
- After DB migration is stable, optionally containerize backend later.

### 5.3 Recommended `docker-compose.yml`

Create `docker-compose.yml` at the project root:

```yaml
services:
  db:
    image: mysql:8.0
    container_name: sahabatqolbu-db
    restart: unless-stopped
    command:
      - --character-set-server=utf8mb4
      - --collation-server=utf8mb4_unicode_ci
      - --default-time-zone=+07:00
    ports:
      - "3307:3306"
    env_file:
      - .env.docker
    environment:
      MYSQL_DATABASE: ${MYSQL_DATABASE}
      MYSQL_USER: ${MYSQL_USER}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
    volumes:
      - sahabatqolbu_mysql_data:/var/lib/mysql
      - ./docker/mysql/conf.d:/etc/mysql/conf.d:ro
    healthcheck:
      test: ["CMD-SHELL", "mysqladmin ping -h 127.0.0.1 -uroot -p$$MYSQL_ROOT_PASSWORD || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 12

volumes:
  sahabatqolbu_mysql_data:
```

### 5.4 Why port `3307` is better for the first move

Use `3307` first, not `3306`, because it allows:

- Laragon MySQL and Docker MySQL to run side-by-side
- easier comparison and validation
- lower-risk cutover

After validation is complete, you can:

- keep Docker on `3307`, or
- stop Laragon MySQL and switch Docker to `3306`

### 5.5 Environment variable handling

#### Root-level compose env file

Create a non-committed file such as `.env.docker`:

```env
MYSQL_DATABASE=sahabatqolbu_db
MYSQL_USER=sq_app
MYSQL_PASSWORD=change_me
MYSQL_ROOT_PASSWORD=change_me_root
```

#### Backend env for host-run backend + Docker DB

Update backend env values to point to Docker:

```env
DB_HOST=127.0.0.1
DB_PORT=3307
DB_USER=sq_app
DB_PASSWORD=change_me
DB_NAME=sahabatqolbu_db
```

Notes:

- `127.0.0.1` is safer than `localhost` on Windows when you want predictable IPv4 behavior.
- Dashboard and frontend env files do **not** need DB changes if backend still runs on host `localhost:5000`.

#### If backend is containerized later

Then backend should use:

```env
DB_HOST=db
DB_PORT=3306
```

### 5.6 Volume and persistence plan

Use a named volume:

- `sahabatqolbu_mysql_data:/var/lib/mysql`

Why:

- container recreation will not destroy the database
- Docker handles storage location cleanly on Windows
- safer than relying on ephemeral container filesystem

Optional:

- mount `./docker/mysql/conf.d` for custom MySQL config
- mount `./docker/mysql/init` only for first-boot seed scripts, not for live migration imports

### 5.7 Export from Laragon

Recommended export command:

```bash
mysqldump \
  --single-transaction \
  --routines \
  --triggers \
  --events \
  --default-character-set=utf8mb4 \
  --hex-blob \
  -u root -p \
  sahabatqolbu_db > laragon-backup.sql
```

If Laragon uses a different user or password, substitute accordingly.

### 5.8 Import into Docker

1. Start the container:

    ```bash
    docker compose up -d db
    ```

2. Wait until the healthcheck passes.

3. Import the dump:

    ```bash
    docker exec -i sahabatqolbu-db \
      mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" --default-character-set=utf8mb4 sahabatqolbu_db \
      < laragon-backup.sql
    ```

If shell env expansion is awkward on Windows, use the literal credentials directly in the command from your local terminal, but do not place them in tracked files.

### 5.9 Validation after import

Run these checks before changing the application permanently.

#### SQL checks

- `SHOW TABLES;`
- row counts for critical tables
- spot-check representative records in:
  - `users`
  - `packages`
  - `jamaah_data`
  - `jamaah_payments`
  - `agent_data`
  - `notifications`

#### Backend checks

- point backend to Docker DB
- start backend
- verify connection boot logs
- run DB-backed tests:

```bash
ENABLE_DB_INTEGRATION_TESTS=true npm run test:db-integration
```

#### UI checks

- login + OTP
- admin jamaah detail page
- add, reject, and verify payment
- agent profile page
- package listing and detail page

### 5.10 What not to do during the Docker move

- Do **not** run `db:push` blindly against the migrated copy before reviewing the schema diff.
- Do **not** treat runtime schema patching as the migration plan.
- Do **not** cut over straight to Docker on port `3306` before validating on `3307`.
- Do **not** hard-code Docker secrets inside `docker-compose.yml`.

---

## 6. Risks and considerations

### 6.1 Highest-risk items

1. **Schema drift**
   Current migrations do not fully represent current runtime expectations. Rehearsal in Docker is mandatory.

2. **Agent table duplication**
   `agen_profiles` and `agent_data` may contain conflicting values. A merge conflict report is necessary.

3. **Jamaah profile vs booking ambiguity**
   Current code suggests one user may have multiple `jamaah_data` rows. Backfill logic must not accidentally collapse distinct bookings.

4. **Financial reconciliation**
   `jamaah_data.total_payment` and `outstanding` may not perfectly match receipts. Recompute and compare before trusting migrated totals.

5. **Legacy routes still using old transaction model**
   `/admin/transactions` still exists in the backend. Refactor sequencing must preserve finance workflows while payment redesign happens.

6. **Engine or version mismatch between Laragon and Docker**
   If Laragon is MariaDB, import behavior may differ. Test on a clone first.

7. **Timezone and collation consistency**
   Standardize on `utf8mb4` and an explicit timezone. Otherwise date comparisons and text sorting may shift.

8. **Secrets management**
   Real credentials should live in local env files, not tracked compose YAML. Rotate any exposed local credentials as needed.

9. **Uploads are not part of DB migration**
   The backend also depends on `public/uploads`. Dockerizing the DB does not automatically solve file-storage portability.

### 6.2 Recommended acceptance criteria

- Dockerized MySQL runs reproducibly from `docker compose up -d`
- backend boots successfully against Docker DB
- DB integration tests pass
- critical dashboard flows pass manually
- no runtime schema patch is required to make the DB usable
- all canonical finance, document, agent, and jamaah tables have clear ownership and no duplicate source of truth

---

## 7. Recommended implementation order

1. Add Docker MySQL on port `3307`.
2. Rehearse Laragon export and import into Docker.
3. Reconcile current schema so migrations match runtime expectations.
4. Implement canonical table additions.
5. Backfill jamaah, agent, document, and finance data.
6. Switch application reads and writes to new tables.
7. Run tests and smoke checks.
8. Remove runtime schema patching.
9. Retire legacy tables after a soak period.

---

## 8. Short conclusion

The project already has a workable MySQL + Drizzle foundation, but the database has three structural problems that should be fixed before or during Docker migration:

1. `jamaah_data` is overloaded and should be split into **profile + booking**.
2. `agen_profiles` and `agent_data` should be merged into one canonical **agent_profiles** table.
3. Schema evolution must move away from **runtime patching** toward **explicit reviewed migrations**.

For the Docker move itself, the safest path is:

- stand up Docker MySQL on **port 3307**
- import a Laragon dump
- validate side-by-side
- then cut the backend over after tests and reconciliation pass
