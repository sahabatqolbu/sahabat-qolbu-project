# Calon Jamaah Funnel Design

## Goal

Build a production-ready public registration and lead-management funnel for prospective jamaah. Public users register as `CALON_JAMAAH`, explore packages in a dedicated dashboard, record package interest, and convert themselves into `JAMAAH` only after choosing a package. Admin and staff can follow up leads from the dashboard before conversion.

## Non-Goals

- Do not move login/register forms into the landing domain. Auth stays on `https://dashboard.sahabatqolbu.com/login`.
- Do not rebuild the landing page from scratch. Improve it section by section while preserving the current brand direction.
- Do not add public role selection. Public registration always creates `CALON_JAMAAH`.
- Do not require CAPTCHA for the first release because domain setup is blocked. Keep the integration optional via environment flags.

## Confirmed Product Decisions

- Add a new role: `CALON_JAMAAH`.
- Public register creates `CALON_JAMAAH` only.
- Register requires OTP/email verification before session activation.
- `CALON_JAMAAH` dashboard lives in the existing dashboard app at `/calon-jamaah`.
- A prospective jamaah must select a package before converting to `JAMAAH`.
- Conversion happens immediately after package selection and confirmation. Admin approval stays in the existing `JAMAAH` onboarding verification flow.
- After conversion, the user can only access `/jamaah`; `/calon-jamaah` redirects to `/jamaah`.
- Admin/staff need CRM-style follow-up access because WhatsApp follow-up is a core business reason for this feature.
- Landing content additions must come from backend/database, not static dummy data.

## User Flow

### Registration

1. User clicks `Login` or `Daftar` from landing.
2. User lands on dashboard auth page, for example `/login?tab=register`.
3. Register form asks for:
   - full name
   - email
   - WhatsApp number
   - password
   - password confirmation
4. Backend creates user with role `CALON_JAMAAH`.
5. User must verify OTP/email before session becomes active.
6. After verified, redirect to `/calon-jamaah`.

### Package Interest

1. `CALON_JAMAAH` browses published packages.
2. Detail page offers:
   - `Simpan Minat`
   - `Konsultasi WhatsApp`
   - `Daftar Jadi Jamaah`
3. Only explicit actions count as interest:
   - save interest
   - consult WhatsApp
   - register as jamaah
4. Viewing a package detail page does not create interest, to keep admin data clean.

### Conversion To Jamaah

1. `CALON_JAMAAH` clicks `Daftar Jadi Jamaah` on a package.
2. Confirmation screen shows package name, schedule, price, and onboarding consequence.
3. Submit conversion:
   - update user role from `CALON_JAMAAH` to `JAMAAH`
   - create one `jamaah_data` record for the same user
   - assign selected `packageId`
   - set initial onboarding status using existing jamaah status model
   - create lead timeline event with status `CONVERTED`
4. Redirect to `/jamaah/onboarding`.
5. User completes biodata/documents using existing jamaah dashboard.
6. Admin verifies jamaah data/documents through existing approval flow.

Conversion must be idempotent. Repeated submit must not create duplicate jamaah records.

## Dashboard: Calon Jamaah

Path: `/calon-jamaah`

The dashboard should be mobile-first and follow existing dashboard patterns from the `JAMAAH` and `AGEN` mobile views.

Menu:

- `Beranda`
  - account summary
  - newest package CTA
  - recent interested packages
  - WhatsApp consultation CTA
- `Paket Umroh`
  - published package list from backend
  - responsive package cards
- `Detail Paket`
  - photos
  - schedule
  - facilities
  - price
  - interest buttons
  - conversion CTA
- `Paket Diminati`
  - packages where the user took explicit interest action
- `Konsultasi`
  - WhatsApp shortcut
  - company/admin contact info
- `Akun`
  - basic profile
  - phone
  - email/password account actions

## Admin CRM

Admin and staff need a lead-management area for `CALON_JAMAAH`.

Permissions:

- `ADMIN`
  - full access
  - manual convert to `JAMAAH`
  - update follow-up status
  - add timeline notes
  - view lead source and interests
- `STAFF`
  - view leads
  - update follow-up status
  - add timeline notes
  - open WhatsApp link
- `FINANCE`
  - no access before conversion
- `AGEN`
  - no access for this release, except source attribution can be recorded if a lead comes from agent/referral links

Lead list columns:

- full name
- email
- WhatsApp
- registered date
- source/referral
- latest interested package
- follow-up status
- last follow-up timestamp

Follow-up statuses:

- `BARU`
- `DIHUBUNGI`
- `TERTARIK`
- `BELUM_RESPON`
- `CONVERTED`

Timeline note fields:

- prospect id
- actor user id
- follow-up status
- note
- created timestamp

## Attribution

Default leads are general company leads. If registration or interest comes from an agent slug/referral URL, store the source on the prospect profile and carry it into conversion where possible.

## Landing Page

Landing remains a marketing surface and should not own credentials.

Auth links:

- Header `Login` points to dashboard login.
- Register CTA points to `/login?tab=register` on dashboard domain.

Package CTAs:

- Public URLs keep slugs for SEO and readability.
- Dashboard receives package context as slug, for example:
  - `/login?tab=register&next=/calon-jamaah/paket/umroh-july-2026-landing-madinah`
- Dashboard resolves slug to backend package.
- Missing/unpublished package shows a clear not-found state.

Design direction:

- Improve existing landing, do not total rebuild.
- Keep navy/gold brand direction.
- Tone: amanah, premium, edukatif.
- Avoid overly salesy travel-promo style.
- Make the reason for choosing Sahabat Qolbu clearer:
  - legalitas
  - bimbingan sesuai sunnah
  - pendampingan
  - tim medis pribadi
  - transparansi jadwal/fasilitas

## Public Content From Database

Landing additions must fetch from backend/database.

Company profile:

- existing `vision`
- existing `mission`
- new structured `philosophy`
- new structured `targetMarket`

`philosophy` format:

```json
[
  {
    "title": "Amanah",
    "description": "Pelayanan dan informasi perjalanan disampaikan secara jelas."
  }
]
```

`targetMarket` format:

```json
[
  {
    "title": "Keluarga yang ingin umroh nyaman",
    "description": "Pendampingan dan edukasi dari persiapan sampai kepulangan."
  }
]
```

Dashboard admin should edit these as simple repeaters:

- title input
- description textarea
- add item
- remove item
- maximum 6 items per section

FAQ:

- managed fully by admin dashboard
- fields: question, answer, category, sort order, active/inactive
- landing renders active FAQ only
- if no active FAQ exists, hide the FAQ section

Gallery:

- photo-focused
- admin uploads photos
- landing renders masonry/responsive grid
- supports mixed portrait/landscape image ratios
- mobile: 1-2 columns
- desktop: 3-4 columns
- lazy-load images
- if no gallery photos exist, hide the gallery section

## Backend Scope

Role and auth:

- Add `CALON_JAMAAH` to role enum.
- Add register endpoint/controller path for public calon jamaah registration.
- Public registration ignores client-supplied role.
- OTP/email verification required before active session.
- Add role redirect support for `CALON_JAMAAH`.

Suggested tables:

- `prospect_jamaah`
  - user id
  - follow-up status
  - source type/source slug/source agent id
  - converted jamaah id
  - converted at
  - timestamps
- `prospect_package_interests`
  - prospect id
  - package id
  - action type: `SAVED`, `WHATSAPP_CONSULT`, `CONVERT_REQUEST`
  - source path/referrer if useful
  - timestamps
- `prospect_follow_ups`
  - prospect id
  - actor user id
  - status
  - note
  - timestamp

API groups:

- auth/register calon jamaah
- calon jamaah dashboard
- prospect interest tracking
- conversion to jamaah
- admin/staff prospect CRM
- public company content
- public FAQ
- public gallery

## Security

CAPTCHA:

- Skip Turnstile for the first implementation because domain access is blocked.
- Keep optional Turnstile hooks via environment flags for later.

Required now:

- stricter rate limiting for register, login, request OTP, forgot password
- OTP cooldown per email/IP
- honeypot field on public register
- minimum submit time on public register/login forms
- generic auth errors where appropriate
- security logs for suspicious auth activity

## Implementation Strategy

Use vertical slices, not a big-bang rewrite:

1. Register `CALON_JAMAAH` through dashboard auth and redirect into `/calon-jamaah`.
2. Build calon jamaah dashboard package browsing and interest capture.
3. Build admin/staff prospect CRM follow-up.
4. Build package-selected conversion to `JAMAAH`.
5. Add database-backed landing content: company philosophy/market, FAQ, gallery.
6. Redesign landing sections incrementally and verify responsive behavior.
7. Harden auth and finalize production checks.

Each slice should be independently testable and pushed only after lint/build/tests pass for touched apps.

## Testing Requirements

Backend:

- registration creates `CALON_JAMAAH` only
- client cannot set elevated role during public register
- OTP verification activates session
- role guards allow `/calon-jamaah` for `CALON_JAMAAH`
- role guards redirect converted users to `/jamaah`
- interest actions create expected records
- conversion is idempotent
- conversion requires selected package
- staff/admin permissions differ correctly

Dashboard:

- register tab flow
- role redirect after verification
- package list/detail responsive
- interest buttons update UI
- conversion confirmation and redirect
- admin prospect list/detail/timeline

Landing:

- auth links target dashboard domain
- package CTAs carry slug context
- FAQ/gallery hide when empty
- content sections render from backend data
- mobile and desktop screenshots for key pages

## Open Risks

- Database enum migration for role must be handled carefully on production MySQL.
- Existing dirty frontend worktree may contain unrelated route changes; implementation must avoid mixing unrelated edits.
- If current admin company profile UI is large or brittle, repeater fields for philosophy/market may require a focused refactor.
- CAPTCHA cannot be fully enabled until domain access is available, so rate limit and cooldown hardening are mandatory.
