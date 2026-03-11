# MoonPharma eBMR — Platform Documentation

> Electronic Batch Manufacturing Record (eBMR) SaaS for pharmaceutical manufacturing.
> Built to comply with 21 CFR Part 11, ALCOA+, and GMP standards.

---

## Table of Contents

1. [Platform Overview](#platform-overview)
2. [Architecture](#architecture)
3. [Tech Stack](#tech-stack)
4. [Route Structure](#route-structure)
5. [Database Schema](#database-schema)
6. [Authentication & Security](#authentication--security)
7. [Admin Platform](#admin-platform)
8. [eBMR Application](#ebmr-application)
9. [API Reference](#api-reference)
10. [Ontology / Lookup System](#ontology--lookup-system)
11. [Invitation Flow](#invitation-flow)
12. [E-Signature & Two-Person Rule](#e-signature--two-person-rule)
13. [RBAC — Role Permissions](#rbac--role-permissions)
14. [Configuration System](#configuration-system)
15. [Design System](#design-system)
16. [Running Locally](#running-locally)
17. [Test Suite](#test-suite)

---

## Platform Overview

MoonPharma eBMR is a multi-tenant SaaS platform where each pharmaceutical company (organisation) gets their own isolated data environment. The platform has two distinct areas:

| Area | URL | Purpose |
|---|---|---|
| Landing | `/` | Public marketing page |
| Login / Register | `/login`, `/register` | Authentication |
| Invitation Accept | `/invitations/[token]` | New member onboarding |
| Admin Dashboard | `/admin/*` | Org setup: team, roles, config, subscription |
| eBMR App | `/dashboard`, `/batches`, `/mbr`, etc. | Manufacturing operations |

The intended user journey:
```
Landing → Login → Admin Dashboard (setup team + config) → eBMR App
```

---

## Architecture

```
moonpharma-ebmr/
├── prisma/
│   ├── schema.prisma              # Full data model
│   ├── migrations/
│   │   ├── 20260304155427_init/   # Base schema
│   │   └── 20260305000000_add_admin_platform/  # Invitations, Config, Lookups
│   └── seed/
│       └── seed.ts                # Full mock data seeder
├── src/
│   ├── app/
│   │   ├── (public)/              # Unauthenticated pages
│   │   │   ├── page.tsx           # Landing page
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── invitations/[token]/   # Invitation acceptance
│   │   ├── (dashboard)/           # eBMR app (auth required)
│   │   │   ├── dashboard/
│   │   │   ├── batches/
│   │   │   ├── mbr/
│   │   │   ├── review/
│   │   │   ├── deviations/
│   │   │   ├── products/
│   │   │   ├── materials/
│   │   │   ├── equipment/
│   │   │   ├── audit-trail/
│   │   │   └── settings/
│   │   ├── (admin)/               # Admin dashboard (admin role only)
│   │   │   ├── admin/
│   │   │   │   ├── page.tsx       # Overview + setup checklist
│   │   │   │   ├── team/          # Invite members, manage users
│   │   │   │   ├── roles/         # Permission matrix (read-only)
│   │   │   │   ├── subscription/  # Plan + usage meters
│   │   │   │   └── config/
│   │   │   │       ├── page.tsx   # Config hub
│   │   │   │       ├── numbering/ # Batch/deviation number formats
│   │   │   │       ├── workflow/  # QA stages, e-sig, timeouts
│   │   │   │       └── categories/ # Lookup category management
│   │   └── api/                   # All API route handlers
│   ├── features/                  # Feature-sliced modules
│   │   ├── auth/
│   │   ├── admin/
│   │   ├── dashboard/
│   │   ├── batches/
│   │   ├── mbr/
│   │   ├── review/
│   │   ├── deviations/
│   │   ├── products/
│   │   ├── materials/
│   │   └── equipment/
│   ├── server/db/
│   │   └── prisma.ts              # Prisma client singleton
│   ├── shared/
│   │   ├── components/layout/
│   │   │   ├── AppSidebar.tsx     # eBMR app sidebar (collapsible, black)
│   │   │   └── AppHeader.tsx
│   │   └── constants/routes.ts
│   ├── generated/prisma/          # Generated Prisma client
│   └── middleware.ts              # Auth + RBAC middleware
├── scripts/
│   └── e2e-test.ts                # End-to-end smoke test suite
└── prisma.config.ts               # Prisma config (non-standard location)
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.1.6 (App Router, Turbopack) |
| Language | TypeScript 5 |
| Database | PostgreSQL (Supabase local / hosted) |
| ORM | Prisma 7 with `@prisma/adapter-pg` + `PrismaPg` |
| Auth | NextAuth v4 (JWT strategy, credentials provider) |
| UI Components | shadcn/ui |
| Styling | Tailwind CSS v4 |
| Forms | React Hook Form + Zod |
| Animations | CSS keyframes (globals.css) |
| Dev DB | Supabase local via Docker |

---

## Route Structure

### Public (no auth required)
| Route | Description |
|---|---|
| `/` | Landing page |
| `/login` | Login form |
| `/register` | Registration |
| `/invitations/[token]` | Invitation acceptance page |

### eBMR App (auth required)
| Route | Description | RBAC |
|---|---|---|
| `/dashboard` | Stats, recent batches, quick actions | All |
| `/batches` | Batch list + create | All |
| `/batches/[id]` | Batch execution — step-by-step | All |
| `/mbr` | Master Batch Records list | All |
| `/mbr/[id]` | MBR detail / template | All |
| `/review` | QA review queue | QA roles + admin |
| `/deviations` | Deviation list + create | All |
| `/products` | Product catalogue | All |
| `/materials` | Materials list | All |
| `/equipment` | Equipment list | All |
| `/audit-trail` | Audit log | admin, qa_head, qa_reviewer |
| `/settings` | Org settings | admin |

### Admin Dashboard (admin role only)
| Route | Description |
|---|---|
| `/admin` | Overview + setup checklist |
| `/admin/team` | Invite members, manage users, revoke invites |
| `/admin/roles` | Full permission matrix (read-only) |
| `/admin/subscription` | Plan info + usage meters |
| `/admin/config` | Configuration hub |
| `/admin/config/numbering` | Batch/deviation number format + prefix |
| `/admin/config/workflow` | QA stages, e-sig method, timeouts, toggles |
| `/admin/config/categories` | Lookup categories (material types, equipment types, etc.) |

---

## Database Schema

### Core Models

#### Organization
Multi-tenant root. Every record in the system belongs to an org via `orgId`.
```
Organization
  id, name, licenseNumber, gmpCertificateNumber
  address, city, state, country, pincode
  contactEmail, contactPhone, website
  plan (starter | professional | enterprise)
  isActive, createdAt, updatedAt
```

#### User
```
User
  id, orgId, email, fullName, employeeId
  role (admin | production_head | supervisor | operator | qa_reviewer | qa_head)
  department, designation
  passwordHash, eSignaturePinHash
  isActive, lastLoginAt, createdAt, updatedAt
```

#### Product
```
Product
  id, orgId, productName, genericName, strength, dosageForm
  therapeuticCategory, scheduleCategory, shelfLife
  storageConditions, handlingPrecautions
  isActive, createdAt, updatedAt
```

#### Material
```
Material
  id, orgId, materialCode, materialName
  type (active | excipient | packaging | consumable)
  grade (IP | BP | USP | In_house)
  vendor, storageCondition, reorderLevel
  isActive, createdAt, updatedAt
```

#### Equipment
```
Equipment
  id, orgId, equipmentCode, equipmentName, equipmentType
  model, serialNumber, manufacturer
  location, calibrationDueDate, qualificationStatus
  isActive, createdAt, updatedAt
```

#### MasterBatchRecord (MBR)
```
MasterBatchRecord
  id, orgId, productId, mbrCode, version
  batchSizeValue, batchSizeUnit
  theoreticalYieldValue, theoreticalYieldUnit
  yieldLimitMin, yieldLimitMax
  effectiveDate, reviewDate
  status (draft | approved | superseded | obsolete)
  createdById, approvedById, approvedAt

  → MBRStep[]           (ordered manufacturing steps)
    → MBRStepParameter[] (parameters with spec limits)
    → MBRStepIPC[]       (in-process control checks)
  → MBRMaterial[]        (BOM with required quantities + tolerances)
  → MBREquipment[]       (required equipment per step)
```

#### Batch
```
Batch
  id, orgId, mbrId, batchNumber
  manufacturingDate, expiryDate
  status (planned | in_progress | under_review | approved | rejected | on_hold)
  currentStepNumber
  actualYieldValue, actualYieldUnit, yieldPercentage
  initiatedById, startedAt, completedAt

  → BatchStepExecution[] (actual values recorded per step)
  → BatchReview[]        (QA review records — one per reviewType)
  → Deviation[]          (linked deviations)
```

#### BatchReview
One record per review stage (production_review, qa_review, qa_head_approval).
```
BatchReview
  id, batchId, reviewType, status, reviewerId
  comments, signature, signedAt
  createdAt, updatedAt
```

#### Deviation
```
Deviation
  id, orgId, batchId (optional), deviationNumber
  title, description, category
  severity (minor | major | critical)
  status (open | under_investigation | closed)
  rootCause, correctiveAction, preventiveAction
  detectedById, assignedToId
  detectedAt, closedAt, createdAt, updatedAt
```

#### AuditLog
```
AuditLog
  id, orgId, userId, action (CREATE|UPDATE|DELETE|SIGN|LOGIN|LOGOUT|VIEW|EXPORT)
  entityType, entityId, description
  ipAddress, userAgent, metadata
  createdAt
```

### Admin Platform Models

#### Invitation
Token-based invite flow — no email server required for MVP.
```
Invitation
  id, orgId, email, fullName, employeeId, role, department
  token (UUID, unique), status (pending | accepted | expired | revoked)
  expiresAt (7 days), invitedById, acceptedAt
  createdAt
```

#### OrgConfiguration
Per-organisation workflow rules stored in DB (not hardcoded).
```
OrgConfiguration
  id, orgId (unique)
  batchPrefix, batchNumberReset (yearly | monthly | never)
  deviationPrefix, changeControlPrefix
  qaReviewStages (2 or 3)
  requireLineClearance, autoDeviationOnOos, criticalDeviationHold
  eSignatureMethod (pin_only | password_only | password_and_pin)
  sessionTimeoutMinutes, failedLoginLockout
  defaultYieldMin, defaultYieldMax, defaultMaterialTolerance
  createdAt, updatedAt
```

#### LookupCategory
Ontology-driven lookup values — each org manages their own taxonomy.
```
LookupCategory
  id, orgId, categoryType, value, label
  isSystem (protected defaults), isActive, sortOrder
  createdAt
  UNIQUE (orgId, categoryType, value)
```

Category types:
- `material_type` — e.g. active, excipient, packaging, solvent
- `equipment_type` — e.g. granulator, tablet_press, blender
- `deviation_category` — e.g. process, equipment, personnel
- `area_class` — e.g. Class_A, Class_B, Class_C, Class_D

---

## Authentication & Security

### Strategy
- **NextAuth v4** with **JWT session strategy** (no session table in DB)
- Credentials provider (email + password)
- JWT signed with `NEXTAUTH_SECRET` using AES-GCM via `@panva/hkdf`

### Session Token
The JWT payload includes:
```json
{
  "id": "user-uuid",
  "role": "admin",
  "orgId": "org-uuid",
  "employeeId": "EMP001",
  "fullName": "Mehtab Afsar",
  "email": "mehtabafsar346@gmail.com"
}
```

### Middleware (`src/middleware.ts`)
```
withAuth → authorized callback
  → / (landing) — always allowed
  → /invitations/* — always allowed (public)
  → /api/invitations/accept — always allowed (public API)
  → everything else — requires valid JWT

middleware function (runs only when authorized = true):
  → /admin/* — admin role only, else → /dashboard
  → /settings → admin role only, else → /dashboard
  → /audit-trail → admin + qa roles only, else → /dashboard
```

### Password Hashing
- bcrypt with salt rounds = 12
- Separate hash stored for e-signature PIN

---

## Admin Platform

### Overview Page (`/admin`)
- Organisation name + plan badge
- Setup checklist: invite team / configure workflow / set categories
- 3 stat cards: team size, open invitations, categories configured
- Quick action links

### Team Management (`/admin/team`)
Two tabs:

**Members tab**
- Table of all org users: avatar initials, role badge, active status
- ⋮ menu: Edit user (fullName, role, department, designation) / Activate / Deactivate
- Self-deactivation blocked server-side

**Invitations tab**
- Create invitation form → generates shareable link
- Admin copies link and sends manually (no email server needed for MVP)
- Invitation table: status colour-coded, Revoke button for pending invites
- Token expires in 7 days

### Roles Page (`/admin/roles`)
Read-only permission matrix — 6 roles × all actions across 7 feature groups. Clearly shows what each role can and cannot do.

### Subscription Page (`/admin/subscription`)
- Current plan card (Starter / Professional / Enterprise)
- Usage meters: team members, batches this month, products
- Warning at ≥80% usage
- Upgrade CTA (disabled in MVP)

### Configuration (`/admin/config/*`)

**Numbering Formats**
- Prefix + counter reset per document type
- Live preview updates as you type (e.g. `BCH-2026-001`)

**Workflow Rules**
- QA review stages (2 or 3)
- Toggle: require line clearance
- Toggle: auto-create deviation on OOS parameter
- Toggle: critical deviation auto-holds batch
- E-signature method selector
- Session timeout + failed login lockout
- Default yield range + material tolerance

**Lookup Categories**
- Tab per category type
- Add custom categories (value auto-slugified from label)
- Toggle active/inactive per category
- Reorder with up/down arrows
- Delete custom categories (system categories protected)
- "Seed defaults" button populates 24 system defaults

---

## eBMR Application

### Dashboard (`/dashboard`)
- Personalised greeting
- Onboarding checklist (hidden once setup complete)
- 4 stat cards with count-up animation (staggered left→right, slide up from bottom)
- Quick action cards
- Recent batches table (last 6)

### Master Batch Records (`/mbr`)
Templates defining how a product must be manufactured:
- Ordered steps with parameters (numeric, text, checkbox) and IPC checks
- Bill of materials with required quantities and tolerances
- Required equipment per step
- Approval workflow (draft → approved)
- Version-controlled (new version supersedes old)

### Batches (`/batches`)
Execution of an approved MBR for a specific production run:
- Batch number auto-generated from prefix + counter
- Step-by-step execution with actual value recording
- Parameter validation against MBR spec limits → OOS triggers deviation
- Line clearance checkbox per step (if enabled in config)
- Two-person e-signature at completion of each step
- Status flow: `planned → in_progress → under_review → approved / rejected`

### Review Queue (`/review`)
QA review workflow:
- Stage 1: Production Supervisor review
- Stage 2: QA Reviewer review
- Stage 3: QA Head approval (if 3-stage config)
- Each stage requires e-signature (PIN)
- Comments required for rejection / return for correction

### Deviations (`/deviations`)
- Raised manually or auto-generated (OOS parameter)
- Severity: minor / major / critical
- Critical severity auto-holds the batch
- Lifecycle: open → under_investigation → closed
- Root cause + CAPA fields

### Products, Materials, Equipment
Master data management — create, edit, activate/deactivate records used across MBRs and batches.

### Audit Trail (`/audit-trail`)
Immutable log of all actions: CREATE, UPDATE, DELETE, SIGN, LOGIN, LOGOUT, VIEW, EXPORT. Filterable by action type, entity, user, date range.

---

## API Reference

### Auth
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/auth/session` | — | Current session |
| GET | `/api/auth/csrf` | — | CSRF token |
| POST | `/api/auth/callback/credentials` | — | Login |
| POST | `/api/auth/verify-pin` | ✓ | Two-person PIN check |

### Users
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/users` | admin | List all org users |
| PATCH | `/api/users/[id]` | admin | Edit user details |
| PATCH | `/api/users/[id]/status` | admin | Toggle active/inactive |

### Invitations
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/invitations` | admin | List org invitations |
| POST | `/api/invitations` | admin | Create invitation + token |
| DELETE | `/api/invitations/[id]` | admin | Revoke pending invitation |
| GET | `/api/invitations/accept` | public | Validate token |
| POST | `/api/invitations/accept` | public | Accept → create account |

### Configuration
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/config` | ✓ | Get org config (auto-creates defaults) |
| PUT | `/api/config` | admin | Update org config |
| POST | `/api/config/seed` | admin | Seed default lookup categories |
| GET | `/api/config/categories` | ✓ | List categories (`?type=material_type`) |
| POST | `/api/config/categories` | admin | Create custom category |
| PATCH | `/api/config/categories/[id]` | admin | Update category |
| DELETE | `/api/config/categories/[id]` | admin | Delete (custom only) |

### eBMR Core
| Method | Path | Auth | Description |
|---|---|---|---|
| GET/POST | `/api/products` | ✓ | List / create products |
| GET/PATCH | `/api/products/[id]` | ✓ | Get / update product |
| GET/POST | `/api/materials` | ✓ | List / create materials |
| GET/POST | `/api/equipment` | ✓ | List / create equipment |
| GET/POST | `/api/mbr` | ✓ | List / create MBRs |
| GET/PATCH | `/api/mbr/[id]` | ✓ | Get / update MBR |
| POST | `/api/mbr/[id]/approve` | qa_head, admin | Approve MBR |
| GET/POST | `/api/batches` | ✓ | List / create batches |
| GET/PATCH | `/api/batches/[id]` | ✓ | Get / update batch |
| POST | `/api/batches/[id]/steps/[n]/execute` | ✓ | Record step execution |
| GET/POST | `/api/deviations` | ✓ | List / create deviations |
| GET/POST | `/api/review` | qa roles | Review queue |
| GET | `/api/audit-trail` | restricted | Audit log |

---

## Ontology / Lookup System

Instead of hardcoded enums for domain values, each organisation stores their own lookup taxonomy in `LookupCategory`. This means:

- MoonPharma uses `active`, `excipient`, `packaging` as material types
- Another pharma company could add `solvent`, `intermediate`, `excipient_blend`
- All without a code change or schema migration

**24 system defaults** are seeded on first setup (via `POST /api/config/seed` or the Admin UI button):

| Category | System Values |
|---|---|
| material_type | active, excipient, packaging, consumable |
| equipment_type | granulator, tablet_press, blender, coater, capsule_filler, autoclave, oven, balance |
| deviation_category | process, equipment, personnel, material, environmental, documentation, other |
| area_class | Class_A, Class_B, Class_C, Class_D, Unclassified |

System values (`isSystem: true`) cannot be deleted, only deactivated.

---

## Invitation Flow

```
Admin                         System                        New Member
  │                              │                              │
  ├─ Fill invite form ──────────►│                              │
  │  (name, email, role, dept)   │                              │
  │                              ├─ Generate UUID token         │
  │                              ├─ Insert Invitation record    │
  │                              ├─ Return invite link ────────►│
  │◄── Copy link shown in UI ────┤                              │
  │                              │                              │
  ├─ Share link manually ────────┼──────────────────────────────►
  │  (Slack, email, WhatsApp)    │                              │
  │                              │                              │
  │                              │◄─ GET /invitations/[token] ──┤
  │                              ├─ Validate token (7d expiry)  │
  │                              ├─ Show org name + role ──────►│
  │                              │                              │
  │                              │◄─ Set password + 4-digit PIN ┤
  │                              ├─ Create User record          │
  │                              ├─ Hash password (bcrypt 12)   │
  │                              ├─ Hash PIN (bcrypt 12)        │
  │                              ├─ Mark invitation accepted    │
  │                              ├─ 201 Created ───────────────►│
  │                              │                              ├─ Redirect to /login
```

---

## E-Signature & Two-Person Rule

GMP compliance requires that critical steps are verified by a second person (not the person performing the action).

### Flow
1. User A performs an action (e.g. records a batch step)
2. System prompts for a second verifier
3. User B enters **their own** employee ID + PIN
4. Server checks:
   - Employee ID exists in same org
   - PIN matches stored bcrypt hash
   - Employee ID ≠ current session user (blocks self-verification → **403**)
5. Action is signed and timestamped in AuditLog

### E-Signature Methods (configurable per org)
| Method | Description |
|---|---|
| `pin_only` | 4-digit PIN only (default) |
| `password_only` | Account password |
| `password_and_pin` | Both required |

---

## RBAC — Role Permissions

| Permission | admin | production_head | supervisor | operator | qa_reviewer | qa_head |
|---|---|---|---|---|---|---|
| View batches | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Create batch | ✓ | ✓ | ✓ | — | — | — |
| Execute steps | ✓ | ✓ | ✓ | ✓ | — | — |
| Create MBR | ✓ | — | — | — | — | ✓ |
| Approve MBR | ✓ | — | — | — | — | ✓ |
| QA review | ✓ | — | — | — | ✓ | ✓ |
| QA head approval | ✓ | — | — | — | — | ✓ |
| Create deviation | ✓ | ✓ | ✓ | — | ✓ | ✓ |
| Audit trail | ✓ | — | — | — | ✓ | ✓ |
| Manage team | ✓ | — | — | — | — | — |
| Configure org | ✓ | — | — | — | — | — |

---

## Configuration System

All workflow rules are stored in `OrgConfiguration` and are read at runtime — no code change needed.

### Numbering
```
Batch number format:   {batchPrefix}-{year}-{counter}
                       e.g. B-2026-001

Deviation format:      {deviationPrefix}-{year}-{counter}
                       e.g. DEV-2026-001

Counter reset:         yearly | monthly | never
```

### Workflow Rules
- **QA stages**: 2 (production + QA) or 3 (+ QA head)
- **Line clearance**: If enabled, operators must confirm area/equipment clean before each step
- **Auto-deviation on OOS**: Automatically raise a deviation when a recorded parameter falls outside spec limits
- **Critical deviation hold**: Batch status → `on_hold` when a critical severity deviation is raised
- **E-signature method**: pin_only / password_only / password_and_pin
- **Session timeout**: Minutes of inactivity before auto sign-out
- **Failed login lockout**: Max consecutive failures before account lock

---

## Design System

### Principles
- **Black and white only** — zero colour (Tailwind uses `oklch(... 0 ...)` chroma)
- **Minimalist** — whitespace-heavy, no gradients, no shadows except on hover
- **System font** — no custom typeface

### Key Tokens
| Element | Style |
|---|---|
| App sidebar | `bg-black` |
| Active nav item | `bg-white text-black` |
| Inactive nav item | `text-white/50 hover:text-white` |
| Primary button | `bg-black text-white hover:bg-gray-800` |
| Card | `bg-white border border-gray-200 rounded-xl` |
| Status badge | `bg-gray-50 border-gray-200 text-gray-700` |
| Admin sidebar | `bg-gray-950` |

### Animations
| Animation | Usage |
|---|---|
| `statCardIn` | Dashboard stat cards slide up from bottom-left → top-right, staggered |
| `fadeInUp` | General page content entrance |
| `pageEnter` | Page-level entrance |
| `rowIn` | Table rows staggered entrance |
| `badgePop` | Status badge appearance |
| `shake` | Form error feedback |
| `msgIn` | AI assistant chat messages |
| Count-up | Stat card numbers animate from 0 to target on intersection |

---

## Running Locally

### Prerequisites
- Node.js 20+
- Docker Desktop (for Supabase local)
- pnpm / npm

### Setup
```bash
# 1. Install dependencies
npm install

# 2. Start Supabase (Docker Desktop must be running)
npx supabase start

# 3. Apply database migrations
npx dotenv -e .env -- npx prisma migrate deploy

# 4. Generate Prisma client
npx dotenv -e .env -- npx prisma generate

# 5. Seed mock data
npm run seed

# 6. Start dev server
npm run dev
# App runs at http://localhost:3000
```

### Default Credentials (after seed)
| Role | Email | Password | PIN |
|---|---|---|---|
| Admin | mehtabafsar346@gmail.com | Moon@123 | 1234 |
| QA Head | suresh.mehta@moonpharma.com | Moon@123 | 1234 |
| QA Reviewer | kavita.nair@moonpharma.com | Moon@123 | 1234 |
| Production Head | ravi.kumar@moonpharma.com | Moon@123 | 1234 |
| Supervisor | priya.sharma@moonpharma.com | Moon@123 | 1234 |
| Operator | arjun.patel@moonpharma.com | Moon@123 | 1234 |

### Seeded Data
- 1 organisation: MoonPharma Pvt. Ltd.
- 7 users (all 6 roles)
- 4 products (Amoxicillin, Metronidazole, Paracetamol, Ibuprofen)
- 15 materials
- 8 equipment
- 3 MBRs (Amoxicillin approved with 10 steps + 18 params, Metronidazole approved, Paracetamol draft)
- 4 batches (in_progress, under_review, approved, planned)
- 3 deviations (closed, under_investigation, open)
- Batch reviews for under_review and approved batches
- 5 audit trail entries

---

## Test Suite

An end-to-end API smoke test is included at `scripts/e2e-test.ts`.

### Run
```bash
# Requires: dev server running + Supabase up + seed applied
npx dotenv -e .env.local -- npx tsx scripts/e2e-test.ts
```

### What it tests (34 tests)

| Section | Tests |
|---|---|
| 0. Preflight | Server reachable, DB connectivity |
| 1. Authentication | CSRF token, real credentials login, session JWT decode |
| 2. Configuration API | GET config, PUT update, POST seed |
| 3. Lookup Categories | List all, filter by type, create, duplicate-409, PATCH, DELETE |
| 4. Invitation API | List, create invite, duplicate email → 409 |
| 5. Invitation Acceptance | Token validation, accept → create account, re-accept → 410 |
| 6. User Management | List users, edit user, deactivate, reactivate |
| 7. E-Signature | Self-verification → 403, wrong employee → 404 |
| 8. Core eBMR Routes | Products, MBRs, Batches, Materials, Equipment, Deviations |
| 9. RBAC Guards | Admin access allowed, non-admin → redirected to /dashboard |

Last run result: **34/34 passed**.

---

*Generated: March 2026 | MoonPharma eBMR v0.1.0*
