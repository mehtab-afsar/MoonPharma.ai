

# Electronic Batch Manufacturing Record (EBMR) — Complete Product Deep Dive

## PART 1: WHAT IS EBMR AND WHY IT EXISTS

---

### The Problem It Solves

In pharmaceutical manufacturing, **every single batch of medicine** produced must have a complete, traceable, tamper-proof record of everything that happened during production. This is a **legal and regulatory mandate** — not optional.

**Today, 60-70% of pharma companies (especially in India, SE Asia, Africa, LatAm) still use PAPER:**

```
A single batch of tablets generates 50–200+ pages:
├── Bill of materials & quantities
├── Equipment used (ID, calibration status)
├── Step-by-step processing instructions
├── Operator entries (weights, times, temperatures)
├── In-process test results (hardness, thickness, pH, etc.)
├── Environmental conditions (temp, humidity)
├── Yield calculations at every stage
├── Deviation notes
├── "Performed by" signatures at every step
├── "Verified by" signatures at every step
├── QA review signatures
├── Final batch release approval
└── 100+ timestamps
```

**The pain of paper:**
| Problem | Impact |
|---|---|
| Illegible handwriting | Data integrity failures, FDA warnings |
| Manual calculation errors | Wrong yields, missed deviations |
| QA reviews every page manually | Batch release takes 5–15 DAYS |
| Lost/damaged pages | Compliance catastrophe |
| No real-time visibility | Production manager is blind |
| Difficult trend analysis | Can't spot recurring problems |
| Storage of records for 7+ years | Warehouses full of paper |
| 30–40% of FDA warning letters | Related to data integrity in records |

---

### What EBMR Actually Is

EBMR is the **digital replacement for the entire paper-based batch record system**. Think of it as:

```
Master Batch Record (MBR) = The RECIPE (template)
     ↓ (instantiate for each batch)
Batch Manufacturing Record (BMR) = The EXECUTION LOG (actual production record)
     ↓ (after production)
Batch Review & Release = QA APPROVAL (digital review & sign-off)
```

**The system enforces:**
- Correct sequence of operations (can't skip steps)
- Real-time data capture with validation rules
- Electronic signatures with authentication
- Complete audit trail (who did what, when, from where)
- Automatic calculations (yield, reconciliation)
- Deviation capture and workflow
- Review by exception (AI can pre-screen)

---

## PART 2: HOW PHARMACEUTICAL BATCH MANUFACTURING WORKS

To build an EBMR, you MUST understand the manufacturing process. Here's the complete flow:

### 2.1 The Master Batch Record (Recipe/Template)

Before any production, R&D and production teams create a **Master Batch Record** for each product-strength-batch size combination.

```
PRODUCT: Amoxicillin Tablets 500mg
BATCH SIZE: 300,000 tablets (150 kg)
MBR VERSION: v3.2
EFFECTIVE DATE: 2024-01-15
APPROVED BY: Head of Production, Head of QA

BILL OF MATERIALS:
┌─────────────────────────┬──────────┬───────────┬───────────┐
│ Material                │ Qty/Batch│ Unit      │ Tolerance │
├─────────────────────────┼──────────┼───────────┼───────────┤
│ Amoxicillin Trihydrate  │ 86.10 kg │ kg        │ ±0.5%     │
│ Microcrystalline Cell.  │ 38.40 kg │ kg        │ ±1.0%     │
│ Croscarmellose Sodium   │  7.50 kg │ kg        │ ±2.0%     │
│ Magnesium Stearate      │  1.50 kg │ kg        │ ±2.0%     │
│ Purified Water          │ 25.00 L  │ L         │ ±5.0%     │
│ HPMC (for coating)      │  4.50 kg │ kg        │ ±2.0%     │
│ ...                     │          │           │           │
└─────────────────────────┴──────────┴───────────┴───────────┘

MANUFACTURING STEPS:
Step 1: Line Clearance & Dispensing
Step 2: Sifting
Step 3: Dry Mixing
Step 4: Granulation
Step 5: Drying
Step 6: Milling
Step 7: Lubrication
Step 8: Compression
Step 9: Coating
Step 10: Packing
```

Each step has:
- Detailed instructions
- Equipment specifications
- Process parameters with limits
- In-process checks with acceptance criteria
- Required signatures

---

### 2.2 Step-by-Step Execution (What Operators Actually Do)

#### **STEP 1: Line Clearance & Dispensing**

```
LINE CLEARANCE:
☐ Previous product cleaned from area
☐ Equipment cleaned and labelled
☐ Area temperature: ___°C (Limit: 20-25°C)
☐ Area humidity: ___%RH (Limit: ≤65%RH)
☐ Cleared by: _________ Date: _______ Time: _______
☐ Verified by: _________ Date: _______ Time: _______

DISPENSING:
Material: Amoxicillin Trihydrate
├── AR Number: ____________
├── Mfg. Batch No: ________
├── Required Qty: 86.10 kg
├── Tolerance: ±0.5% (85.67 - 86.53 kg)
├── Tare Weight: _____ kg
├── Gross Weight: _____ kg  
├── Net Weight: _____ kg    ← SYSTEM VALIDATES THIS
├── Dispensed by: _________ (signature + time)
└── Checked by: __________ (signature + time)

[Repeat for EVERY material]
```

#### **STEP 2: Sifting**

```
Equipment: Vibro Sifter
Equipment ID: VS-012
Sieve Size: #40 mesh

Material: Amoxicillin Trihydrate
├── Quantity loaded: _____ kg
├── Start time: _____
├── End time: _____
├── Quantity passed: _____ kg
├── Retained material: _____ kg
├── Observations: ______________
├── Done by: _________ 
└── Checked by: _________

[Repeat for each material requiring sifting]
```

#### **STEP 3: Dry Mixing**

```
Equipment: Rapid Mixer Granulator (RMG)
Equipment ID: RMG-003
Capacity: 200 kg

Materials loaded:
├── Amoxicillin Trihydrate: _____ kg
├── MCC: _____ kg
├── Croscarmellose Sodium: _____ kg

Mixing Parameters:
├── Impeller Speed: 150 RPM (Limit: 140-160 RPM)
├── Chopper Speed: OFF
├── Mixing Time: 10 min (Limit: 8-12 min)
├── Start Time: _______
├── End Time: _______

Done by: _________ | Checked by: _________
```

#### **STEP 4-7: Granulation → Drying → Milling → Lubrication**
(Similar pattern — parameters, limits, actuals, signatures)

#### **STEP 8: Compression (Most Data-Intensive)**

```
Equipment: Tablet Press
Equipment ID: TP-007 (45-station rotary)
Tooling: 13mm round, biconvex, debossed "AMX 500"

Machine Settings:
├── Turret Speed: _____ RPM
├── Pre-compression force: _____ kN
├── Main compression force: _____ kN
├── Feeder speed: _____ RPM

IN-PROCESS CHECKS (Every 30 minutes):
┌──────────┬────────────┬────────────┬────────────┬────────────┐
│ Time     │ Wt (mg)    │ Hard (N)   │ Thick (mm) │ Friab (%)  │
│          │ 500±5%     │ 40-80 N    │ 4.5±0.2    │ NMT 1.0%   │
├──────────┼────────────┼────────────┼────────────┼────────────┤
│ 09:00    │ 502        │ 55         │ 4.52       │            │
│ 09:30    │ 498        │ 58         │ 4.48       │            │
│ 10:00    │ 505        │ 52         │ 4.55       │ 0.45%      │
│ ...      │ ...        │ ...        │ ...        │ ...        │
└──────────┴────────────┴────────────┴────────────┴────────────┘

DT (Disintegration Time): _____ min (Limit: NMT 15 min)

YIELD:
├── Theoretical yield: 300,000 tablets
├── Actual yield: _______ tablets
├── % Yield: _______ % (Limit: 95-100%)
├── Rejected tablets: _______
└── Reconciliation: Actual + Rejected + Samples = ~Theoretical
```

#### **STEP 9-10: Coating → Packing**
(Similar data-intensive processes)

---

### 2.3 The Review & Release Process

After production is complete:

```
BATCH REVIEW WORKFLOW:
                                                    
Production Operator → Production Supervisor → QA Reviewer → QA Head
   (executes)           (verifies)            (reviews)     (releases)
                                                    
QA REVIEW CHECKLIST:
☐ All pages complete, no blank fields
☐ All calculations verified
☐ All in-process results within limits
☐ All deviations documented and resolved
☐ All signatures present
☐ Yield within acceptable range
☐ Environmental records acceptable
☐ Equipment calibration current
☐ Raw material COAs reviewed
☐ Batch APPROVED / REJECTED / HOLD

WITH PAPER: This review takes 3-15 DAYS
WITH EBMR + AI: This can take 2-4 HOURS
```

---

## PART 3: REGULATORY REQUIREMENTS (NON-NEGOTIABLE)

### 3.1 FDA 21 CFR Part 11 — Electronic Records & Signatures

```
REQUIREMENT                          │ WHAT IT MEANS FOR YOUR SYSTEM
─────────────────────────────────────┼──────────────────────────────────────
Audit Trail                          │ Every action logged: who, what, when,
                                     │ old value, new value, reason for change
                                     │ CANNOT be modified or deleted
─────────────────────────────────────┼──────────────────────────────────────
Electronic Signatures                │ Unique user ID + password (minimum)
                                     │ Linked to their specific record entry
                                     │ Legally binding equivalent of handwritten
─────────────────────────────────────┼──────────────────────────────────────
Access Controls                      │ Role-based permissions
                                     │ Operators can't access admin functions
                                     │ Only authorized users can sign
─────────────────────────────────────┼──────────────────────────────────────
System Validation                    │ Documented evidence system works correctly
                                     │ IQ/OQ/PQ protocols (not MVP concern)
─────────────────────────────────────┼──────────────────────────────────────
Data Integrity                       │ ALCOA+ principles enforced
                                     │ Records cannot be altered without trail
─────────────────────────────────────┼──────────────────────────────────────
Closed System                        │ Access limited to authorized persons
                                     │ System controls who gets in
```

### 3.2 ALCOA+ Principles (Data Integrity Framework)

```
A - Attributable    → Every entry traced to a specific person
L - Legible         → Data is readable (no handwriting issues — solved!)
C - Contemporaneous → Data recorded at the time of the activity
O - Original        → First-capture data preserved
A - Accurate        → Data is correct, verified

+ Complete          → All data included, nothing deleted
+ Consistent        → Timestamps logical, no time travel
+ Enduring          → Data survives for required retention period
+ Available         → Data can be retrieved when needed (audits, inspections)
```

---

## PART 4: YOUR AI-SaaS EBMR PRODUCT DESIGN

### 4.1 Product Name Suggestion
**"BatchWise AI"** or **"PharmaRecord AI"** (or whatever you prefer)

### 4.2 Product Vision
> Replace paper batch records with an intelligent digital system that guides operators through manufacturing, captures data in real-time, and uses AI to accelerate quality review — reducing batch release time from days to hours.

### 4.3 System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js)                       │
│                                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │Dashboard │ │ MBR      │ │ Batch    │ │ Review & │          │
│  │& Reports │ │ Designer │ │ Execution│ │ Approval │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ User &   │ │Deviation │ │ AI       │ │ Audit    │          │
│  │ Roles    │ │ Mgmt     │ │ Assistant│ │ Trail    │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
└────────────────────────┬────────────────────────────────────────┘
                         │ REST API / WebSocket
┌────────────────────────┴────────────────────────────────────────┐
│                     BACKEND (Node.js/Python)                     │
│                                                                  │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌──────────────┐ │
│  │ Auth &     │ │ Batch      │ │ Workflow   │ │ AI Engine    │ │
│  │ E-Sig      │ │ Engine     │ │ Engine     │ │ (Claude API) │ │
│  │ Service    │ │            │ │            │ │              │ │
│  └────────────┘ └────────────┘ └────────────┘ └──────────────┘ │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌──────────────┐ │
│  │ Audit      │ │ Deviation  │ │ PDF/Report │ │ Notification │ │
│  │ Trail      │ │ Service    │ │ Generator  │ │ Service      │ │
│  └────────────┘ └────────────┘ └────────────┘ └──────────────┘ │
└────────────────────────┬────────────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────────────┐
│                      DATABASE (PostgreSQL)                       │
│                                                                  │
│  Users, Roles, Products, MBRs, Batches, BatchSteps,            │
│  Materials, Equipment, InProcessChecks, Deviations,             │
│  Signatures, AuditTrail, Reviews, Approvals                    │
└─────────────────────────────────────────────────────────────────┘
```

---

### 4.3 COMPLETE DATABASE SCHEMA

```sql
-- ============================================
-- TENANT / ORGANIZATION (Multi-tenant SaaS)
-- ============================================
CREATE TABLE organizations (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    license_number VARCHAR(100),       -- Drug manufacturing license
    address TEXT,
    gmp_certificate_number VARCHAR(100),
    subscription_plan VARCHAR(50),     -- 'starter', 'professional', 'enterprise'
    created_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- ============================================
-- USERS & ROLES (21 CFR Part 11 compliant)
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY,
    org_id UUID REFERENCES organizations(id),
    employee_id VARCHAR(50) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,         
    -- 'operator', 'supervisor', 'qa_reviewer', 'qa_head', 
    -- 'production_head', 'admin'
    department VARCHAR(100),
    designation VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    password_changed_at TIMESTAMP,
    password_expiry_days INT DEFAULT 90,
    failed_login_attempts INT DEFAULT 0,
    locked_until TIMESTAMP,
    e_signature_pin_hash VARCHAR(255), -- Separate PIN for e-signatures
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_sessions (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    token_hash VARCHAR(255),
    ip_address VARCHAR(45),
    user_agent TEXT,
    logged_in_at TIMESTAMP DEFAULT NOW(),
    logged_out_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- ============================================
-- PRODUCTS
-- ============================================
CREATE TABLE products (
    id UUID PRIMARY KEY,
    org_id UUID REFERENCES organizations(id),
    product_code VARCHAR(50) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    generic_name VARCHAR(255),
    dosage_form VARCHAR(100),          -- 'Tablet', 'Capsule', 'Syrup', 'Injection'
    strength VARCHAR(100),             -- '500mg', '250mg/5ml'
    shelf_life_months INT,
    storage_conditions TEXT,
    regulatory_category VARCHAR(100),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- ============================================
-- MATERIALS (Raw Materials, Packaging Materials)
-- ============================================
CREATE TABLE materials (
    id UUID PRIMARY KEY,
    org_id UUID REFERENCES organizations(id),
    material_code VARCHAR(50) NOT NULL,
    material_name VARCHAR(255) NOT NULL,
    material_type VARCHAR(50),         -- 'active', 'excipient', 'packaging', 'consumable'
    unit_of_measure VARCHAR(20),       -- 'kg', 'g', 'L', 'ml', 'nos'
    pharmacopeial_grade VARCHAR(50),   -- 'IP', 'BP', 'USP', 'In-house'
    created_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- ============================================
-- EQUIPMENT
-- ============================================
CREATE TABLE equipment (
    id UUID PRIMARY KEY,
    org_id UUID REFERENCES organizations(id),
    equipment_code VARCHAR(50) NOT NULL,
    equipment_name VARCHAR(255) NOT NULL,
    equipment_type VARCHAR(100),       -- 'RMG', 'FBD', 'Tablet Press', 'Coating Pan'
    location VARCHAR(100),
    capacity VARCHAR(100),
    last_calibration_date DATE,
    next_calibration_date DATE,
    last_cleaning_date TIMESTAMP,
    status VARCHAR(50) DEFAULT 'available', -- 'available', 'in_use', 'maintenance', 'retired'
    created_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- ============================================
-- MASTER BATCH RECORD (MBR) — THE RECIPE
-- ============================================
CREATE TABLE master_batch_records (
    id UUID PRIMARY KEY,
    org_id UUID REFERENCES organizations(id),
    product_id UUID REFERENCES products(id),
    mbr_code VARCHAR(50) NOT NULL,
    version INT NOT NULL DEFAULT 1,
    batch_size_value DECIMAL(12,3),
    batch_size_unit VARCHAR(20),       -- 'kg', 'L', 'tablets'
    theoretical_yield_value DECIMAL(12,3),
    theoretical_yield_unit VARCHAR(20),
    yield_limit_min DECIMAL(5,2),      -- e.g., 95.00%
    yield_limit_max DECIMAL(5,2),      -- e.g., 100.00%
    effective_date DATE,
    review_date DATE,
    status VARCHAR(50) DEFAULT 'draft', 
    -- 'draft', 'pending_review', 'approved', 'effective', 'superseded', 'obsolete'
    created_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- MBR Bill of Materials
CREATE TABLE mbr_materials (
    id UUID PRIMARY KEY,
    mbr_id UUID REFERENCES master_batch_records(id),
    material_id UUID REFERENCES materials(id),
    quantity DECIMAL(12,4) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    tolerance_plus DECIMAL(5,2),       -- ±percentage
    tolerance_minus DECIMAL(5,2),
    stage VARCHAR(100),                -- 'Granulation', 'Lubrication', 'Coating'
    sequence_order INT,
    is_critical BOOLEAN DEFAULT false,
    instructions TEXT
);

-- MBR Manufacturing Steps
CREATE TABLE mbr_steps (
    id UUID PRIMARY KEY,
    mbr_id UUID REFERENCES master_batch_records(id),
    step_number INT NOT NULL,
    step_name VARCHAR(255) NOT NULL,
    stage VARCHAR(100),                -- 'Dispensing', 'Granulation', 'Compression'
    instructions TEXT NOT NULL,        -- Detailed work instructions
    equipment_type VARCHAR(100),       -- Required equipment type
    estimated_duration_minutes INT,
    requires_line_clearance BOOLEAN DEFAULT false,
    requires_environmental_check BOOLEAN DEFAULT false,
    env_temp_min DECIMAL(5,2),
    env_temp_max DECIMAL(5,2),
    env_humidity_min DECIMAL(5,2),
    env_humidity_max DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT NOW()
);

-- MBR Step Parameters (process parameters for each step)
CREATE TABLE mbr_step_parameters (
    id UUID PRIMARY KEY,
    mbr_step_id UUID REFERENCES mbr_steps(id),
    parameter_name VARCHAR(255) NOT NULL,  -- 'Impeller Speed', 'Mixing Time', 'Temperature'
    parameter_type VARCHAR(50),            -- 'numeric', 'text', 'boolean', 'selection'
    unit VARCHAR(50),                      -- 'RPM', 'min', '°C', 'kN'
    target_value VARCHAR(100),
    min_value DECIMAL(12,4),
    max_value DECIMAL(12,4),
    selection_options JSONB,               -- For dropdown choices
    is_critical BOOLEAN DEFAULT false,     -- Critical Process Parameter (CPP)
    sequence_order INT
);

-- MBR In-Process Checks
CREATE TABLE mbr_in_process_checks (
    id UUID PRIMARY KEY,
    mbr_step_id UUID REFERENCES mbr_steps(id),
    check_name VARCHAR(255) NOT NULL,      -- 'Individual Weight', 'Hardness', 'DT'
    check_type VARCHAR(50),                -- 'numeric', 'text', 'pass_fail'
    unit VARCHAR(50),
    specification TEXT,                    -- 'NMT 15 min', '500±5%'
    target_value DECIMAL(12,4),
    min_value DECIMAL(12,4),
    max_value DECIMAL(12,4),
    frequency VARCHAR(100),                -- 'Every 30 min', 'Start/Middle/End', 'Once'
    sample_size VARCHAR(100),              -- 'n=20', 'n=10'
    is_critical BOOLEAN DEFAULT false,     -- Critical Quality Attribute (CQA)
    sequence_order INT
);

-- ============================================
-- BATCH MANUFACTURING RECORD (BMR) — THE EXECUTION
-- ============================================
CREATE TABLE batches (
    id UUID PRIMARY KEY,
    org_id UUID REFERENCES organizations(id),
    mbr_id UUID REFERENCES master_batch_records(id),
    batch_number VARCHAR(50) NOT NULL UNIQUE,
    manufacturing_date DATE,
    expiry_date DATE,
    status VARCHAR(50) DEFAULT 'planned',
    -- 'planned', 'in_progress', 'completed', 'under_review', 
    -- 'approved', 'rejected', 'on_hold'
    current_step_number INT DEFAULT 0,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    actual_yield_value DECIMAL(12,3),
    actual_yield_unit VARCHAR(20),
    yield_percentage DECIMAL(5,2),
    initiated_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Batch Material Dispensing Records
CREATE TABLE batch_materials (
    id UUID PRIMARY KEY,
    batch_id UUID REFERENCES batches(id),
    mbr_material_id UUID REFERENCES mbr_materials(id),
    material_id UUID REFERENCES materials(id),
    ar_number VARCHAR(50),             -- Analytical Report / Approved Release number
    supplier_batch_number VARCHAR(100),
    required_quantity DECIMAL(12,4),
    actual_quantity DECIMAL(12,4),
    tare_weight DECIMAL(12,4),
    gross_weight DECIMAL(12,4),
    is_within_tolerance BOOLEAN,
    dispensed_by UUID REFERENCES users(id),
    dispensed_at TIMESTAMP,
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMP,
    status VARCHAR(50) DEFAULT 'pending'  -- 'pending', 'dispensed', 'verified'
);

-- Batch Step Execution
CREATE TABLE batch_steps (
    id UUID PRIMARY KEY,
    batch_id UUID REFERENCES batches(id),
    mbr_step_id UUID REFERENCES mbr_steps(id),
    step_number INT NOT NULL,
    step_name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending',
    -- 'pending', 'in_progress', 'completed', 'skipped_with_deviation'
    equipment_id UUID REFERENCES equipment(id),
    equipment_clean_verified BOOLEAN,
    area_clean_verified BOOLEAN,
    env_temperature DECIMAL(5,2),
    env_humidity DECIMAL(5,2),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    performed_by UUID REFERENCES users(id),
    performed_at TIMESTAMP,
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMP,
    remarks TEXT
);

-- Batch Step Parameter Values (actuals)
CREATE TABLE batch_step_parameters (
    id UUID PRIMARY KEY,
    batch_step_id UUID REFERENCES batch_steps(id),
    mbr_step_parameter_id UUID REFERENCES mbr_step_parameters(id),
    parameter_name VARCHAR(255),
    actual_value VARCHAR(255),
    actual_numeric_value DECIMAL(12,4),
    is_within_limit BOOLEAN,
    recorded_by UUID REFERENCES users(id),
    recorded_at TIMESTAMP DEFAULT NOW()
);

-- Batch In-Process Check Results
CREATE TABLE batch_ipc_results (
    id UUID PRIMARY KEY,
    batch_step_id UUID REFERENCES batch_steps(id),
    mbr_ipc_id UUID REFERENCES mbr_in_process_checks(id),
    check_name VARCHAR(255),
    check_time TIMESTAMP,
    result_value VARCHAR(255),
    result_numeric DECIMAL(12,4),
    is_within_spec BOOLEAN,
    checked_by UUID REFERENCES users(id),
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMP,
    remarks TEXT
);

-- ============================================
-- DEVIATIONS
-- ============================================
CREATE TABLE deviations (
    id UUID PRIMARY KEY,
    org_id UUID REFERENCES organizations(id),
    batch_id UUID REFERENCES batches(id),
    batch_step_id UUID REFERENCES batch_steps(id),
    deviation_number VARCHAR(50) NOT NULL UNIQUE,
    deviation_type VARCHAR(50),        -- 'planned', 'unplanned'
    category VARCHAR(100),             -- 'process', 'equipment', 'material', 'environmental'
    severity VARCHAR(50),              -- 'minor', 'major', 'critical'
    description TEXT NOT NULL,
    root_cause TEXT,
    impact_assessment TEXT,
    corrective_action TEXT,
    preventive_action TEXT,
    status VARCHAR(50) DEFAULT 'open',
    -- 'open', 'under_investigation', 'resolved', 'closed'
    raised_by UUID REFERENCES users(id),
    raised_at TIMESTAMP DEFAULT NOW(),
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMP,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP
);

-- ============================================
-- ELECTRONIC SIGNATURES (21 CFR Part 11)
-- ============================================
CREATE TABLE electronic_signatures (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    record_type VARCHAR(100) NOT NULL,   -- 'batch_step', 'batch_material', 'deviation', 'batch_review'
    record_id UUID NOT NULL,             -- ID of the signed record
    signature_meaning VARCHAR(100),      -- 'performed', 'verified', 'reviewed', 'approved', 'rejected'
    full_name VARCHAR(255) NOT NULL,
    employee_id VARCHAR(50) NOT NULL,
    designation VARCHAR(100),
    signed_at TIMESTAMP DEFAULT NOW(),
    ip_address VARCHAR(45),
    user_agent TEXT,
    signature_hash VARCHAR(255),         -- Hash of (user_id + record_id + meaning + timestamp)
    is_valid BOOLEAN DEFAULT true
);

-- ============================================
-- AUDIT TRAIL (IMMUTABLE — APPEND ONLY!)
-- ============================================
CREATE TABLE audit_trail (
    id BIGSERIAL PRIMARY KEY,            -- Sequential, never gaps
    org_id UUID,
    user_id UUID REFERENCES users(id),
    user_name VARCHAR(255),
    user_role VARCHAR(50),
    action VARCHAR(50) NOT NULL,         -- 'CREATE', 'UPDATE', 'DELETE', 'SIGN', 'LOGIN', 'LOGOUT'
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    field_name VARCHAR(255),
    old_value TEXT,
    new_value TEXT,
    reason_for_change TEXT,              -- Required for edits (GMP requirement)
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()   -- Immutable timestamp
);

-- IMPORTANT: No UPDATE or DELETE permissions on audit_trail!

-- ============================================
-- BATCH REVIEW & RELEASE
-- ============================================
CREATE TABLE batch_reviews (
    id UUID PRIMARY KEY,
    batch_id UUID REFERENCES batches(id),
    review_type VARCHAR(50),            -- 'production_review', 'qa_review', 'qa_head_approval'
    reviewer_id UUID REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'pending',
    -- 'pending', 'in_progress', 'approved', 'rejected', 'returned_for_correction'
    checklist JSONB,                    -- Dynamic checklist items
    comments TEXT,
    ai_review_summary TEXT,             -- AI-generated review summary
    ai_flagged_issues JSONB,            -- AI-detected issues
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- AI INTERACTIONS LOG
-- ============================================
CREATE TABLE ai_interactions (
    id UUID PRIMARY KEY,
    org_id UUID,
    user_id UUID REFERENCES users(id),
    batch_id UUID REFERENCES batches(id),
    interaction_type VARCHAR(100),      -- 'batch_review', 'deviation_analysis', 'trend_analysis', 'query'
    prompt TEXT,
    response TEXT,
    model_used VARCHAR(100),
    tokens_used INT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

### 4.4 COMPLETE MODULE BREAKDOWN

#### **MODULE 1: Authentication & User Management**

```
Features:
├── User registration with employee ID
├── Role-based access control (RBAC)
│   ├── Admin → Full system access
│   ├── Production Head → MBR approval, batch oversight
│   ├── Supervisor → Batch initiation, verification
│   ├── Operator → Batch execution, data entry
│   ├── QA Reviewer → Batch review
│   └── QA Head → Batch release (final approval)
├── Password policies
│   ├── Minimum 8 chars, complexity requirements
│   ├── Password expiry (90 days)
│   ├── Password history (can't reuse last 5)
│   └── Account lockout after 5 failed attempts
├── Electronic Signature PIN (separate from login password)
├── Session management
│   ├── Auto-logout after inactivity (configurable: 15-30 min)
│   └── Single session per user (optional)
└── Login/logout audit logging
```

#### **MODULE 2: Master Batch Record (MBR) Designer**

```
Features:
├── Product Setup
│   └── Create products with basic details
├── MBR Template Builder
│   ├── Define Bill of Materials
│   │   ├── Add materials with quantities and tolerances
│   │   └── Map materials to manufacturing stages
│   ├── Define Manufacturing Steps (sequential)
│   │   ├── Step instructions (rich text)
│   │   ├── Process parameters with limits
│   │   ├── In-process checks with specifications
│   │   ├── Equipment requirements
│   │   └── Environmental requirements
│   ├── Define yield expectations
│   └── Preview MBR as operators would see it
├── Version Control
│   ├── Draft → Review → Approved → Effective
│   ├── New version creates copy, supersedes old
│   └── Full version history maintained
├── Approval Workflow
│   ├── Prepared by → Reviewed by → Approved by
│   └── E-signatures at each stage
│
│  🤖 AI FEATURE:
│  └── "AI MBR Assistant" — Paste an existing paper MBR or 
│      describe your process in natural language, and AI 
│      structures it into the digital template format
```

#### **MODULE 3: Batch Execution** ⭐ (Core Module)

```
Features:
├── Batch Initiation
│   ├── Select product → Select MBR version
│   ├── System generates batch number (configurable format)
│   ├── Set manufacturing date, expiry date
│   └── System creates instance of all steps from MBR
│
├── Material Dispensing Screen
│   ├── Shows required materials from BOM
│   ├── Operator enters: AR#, supplier batch#, weights
│   ├── System auto-validates against tolerance
│   │   ├── ✅ Within tolerance → Green, proceed
│   │   ├── ⚠️ At limit → Yellow warning
│   │   └── ❌ Out of tolerance → Red, blocked, deviation required
│   ├── Dispensed by → e-signature
│   └── Verified by → e-signature (different person!)
│
├── Step-by-Step Execution
│   ├── Shows current step with instructions
│   ├── Line clearance checklist (if required)
│   ├── Environmental conditions capture
│   ├── Equipment selection (from available equipment list)
│   ├── Process parameter entry with real-time validation
│   ├── In-process check entry with spec comparison
│   ├── Performed by → e-signature
│   ├── Verified by → e-signature
│   ├── Cannot proceed to next step until current is complete
│   │   (enforced sequential workflow)
│   └── Timer functionality for time-bound operations
│
├── Yield Calculation
│   ├── Auto-calculated at each stage
│   ├── Cumulative yield tracking
│   └── Alert if yield drops below limit
│
├── Deviation Handling (inline)
│   ├── When any value is out of spec, system prompts deviation
│   ├── Operator describes what happened
│   ├── Supervisor reviews and assesses impact
│   └── Links deviation to specific step/parameter
│
├── Batch Completion
│   ├── All steps completed → Mark batch as "Completed"
│   ├── Final yield reconciliation
│   └── Auto-moves to review queue
│
│  🤖 AI FEATURES:
│  ├── Real-time anomaly detection
│  │   └── "Hardness trending downward across last 5 checks — 
│  │       potential tooling wear?"
│  ├── Smart suggestions
│  │   └── "Similar deviation occurred in Batch B2024-045, 
│  │       root cause was moisture in granules"
│  └── Auto-fill assistance
│      └── Pre-populate fields based on historical data patterns
```

#### **MODULE 4: Review & Approval (QA)**

```
Features:
├── Review Dashboard
│   ├── Batches pending review (queue)
│   ├── Priority sorting (by product, date, deviations)
│   └── Status tracking
│
├── Review Interface
│   ├── Complete batch record viewer
│   │   ├── All materials dispensed
│   │   ├── All steps with parameter values
│   │   ├── All IPC results
│   │   ├── All deviations
│   │   ├── All signatures
│   │   └── Yield summary
│   ├── Review checklist (configurable per org)
│   ├── Comment on specific steps/values
│   ├── Flag issues for correction
│   └── Return to production for corrections
│
├── Approval Workflow
│   ├── Production Supervisor sign-off
│   ├── QA Reviewer sign-off
│   ├── QA Head final approval/rejection
│   └── Batch status → Approved / Rejected / On Hold
│
├── Review by Exception
│   ├── AI pre-reviews entire batch
│   ├── Highlights ONLY anomalies and issues
│   ├── Reviewer focuses on flagged items
│   └── Dramatically reduces review time
│
│  🤖 AI FEATURES (KEY DIFFERENTIATOR):
│  ├── AI Batch Review Summary
│  │   └── "Batch B2024-078 Summary: 10 steps completed. All 
│  │       materials within tolerance. 47 IPC checks — 46 passed,
│  │       1 borderline (hardness 39.5N vs limit 40N at 14:30, 
│  │       subsequent checks normal). 1 minor deviation (D-2024-023)
│  │       for 5-min mixing time extension — resolved. Yield 97.2%.
│  │       RECOMMENDATION: Approve with note on hardness observation."
│  │
│  ├── Cross-Batch Trend Analysis
│  │   └── "Across last 10 batches of Amoxicillin 500mg:
│  │       - Avg yield: 96.8% (declining trend from 98.1%)
│  │       - Hardness trending lower (avg 52N → 45N)
│  │       - Recommend tooling inspection"
│  │
│  └── Deviation Pattern Recognition
│      └── "3 batches this month had moisture-related deviations
│          in granulation stage. Common factor: RMG-003 used in 
│          all cases. Recommend equipment qualification check."
```

#### **MODULE 5: Audit Trail Viewer**

```
Features:
├── Immutable log of every action in the system
├── Filter by: user, date range, batch, action type, table
├── Export for regulatory submission
├── Cannot be modified or deleted (even by admin)
└── Shows: who, what, when, old value, new value, reason
```

#### **MODULE 6: Reports & Dashboard**

```
Features:
├── Production Dashboard
│   ├── Batches in progress (real-time status)
│   ├── Batches pending review
│   ├── Batches released this month
│   ├── Open deviations
│   └── Yield trends
│
├── Reports
│   ├── Batch Manufacturing Record (full PDF — replaces paper!)
│   ├── Batch Summary Report
│   ├── Deviation Report
│   ├── Yield Analysis Report
│   ├── Product-wise Batch History
│   └── Audit Trail Report
│
│  🤖 AI FEATURES:
│  ├── Natural Language Querying
│  │   └── "Show me all batches of Amoxicillin 500mg in the 
│  │       last 3 months where yield was below 97%"
│  └── Predictive Quality Insights
│      └── "Based on current trends, next batch may face 
│          hardness issues. Suggested adjustment: increase 
│          compression force by 5%"
```

#### **MODULE 7: AI Assistant (Chat Interface)**

```
A ChatGPT-like interface specific to batch records:

Capabilities:
├── Query batch data in natural language
│   └── "What was the average yield for Product X last quarter?"
├── Deviation assistance
│   └── "Help me write a root cause analysis for this deviation"
├── SOP / GMP guidance
│   └── "What does 21 CFR 211.188 say about batch record requirements?"
├── Review assistance
│   └── "Summarize the key findings from Batch B2024-078"
└── Trend analysis
    └── "Are there any concerning trends in our compression parameters?"

Context-Aware: AI has access to the batch data (with proper permissions)
to give specific, data-driven answers.
```

---

### 4.5 USER WORKFLOWS (Screen by Screen)

#### **Workflow 1: Creating a Master Batch Record**

```
Screen 1: Product Selection
┌──────────────────────────────────────────────────┐
│  SELECT PRODUCT           [+ New Product]        │
│  ┌────────────────────────────────────────────┐  │
│  │ 🔍 Search products...                     │  │
│  ├────────────────────────────────────────────┤  │
│  │ PRD-001 │ Amoxicillin Tab │ 500mg │ Active │  │
│  │ PRD-002 │ Paracetamol Tab │ 650mg │ Active │  │
│  │ PRD-003 │ Metformin Tab   │ 500mg │ Draft  │  │
│  └────────────────────────────────────────────┘  │
│                              [Select & Continue] │
└──────────────────────────────────────────────────┘

Screen 2: MBR Basic Info
┌──────────────────────────────────────────────────┐
│  MASTER BATCH RECORD                             │
│                                                  │
│  MBR Code: [MBR-AMX500-001]                     │
│  Version: [1]                                    │
│  Batch Size: [150] [kg ▼]                       │
│  Theoretical Yield: [300000] [tablets ▼]        │
│  Yield Limits: Min [95]% — Max [100]%           │
│                                                  │
│  🤖 [Import from existing document]              │
│     Upload a paper MBR/PDF and AI will extract   │
│     the data into structured format              │
│                                                  │
│                           [Save & Add Materials] │
└──────────────────────────────────────────────────┘

Screen 3: Bill of Materials
┌──────────────────────────────────────────────────────────┐
│  BILL OF MATERIALS                    [+ Add Material]  │
│  ┌────┬────────────────┬──────┬──────┬─────────┬──────┐ │
│  │ #  │ Material       │ Qty  │ Unit │ Tol (±%)│ Stage│ │
│  ├────┼────────────────┼──────┼──────┼─────────┼──────┤ │
│  │ 1  │ Amoxicillin    │86.10 │ kg   │ 0.5%    │ Gran │ │
│  │ 2  │ MCC            │38.40 │ kg   │ 1.0%    │ Gran │ │
│  │ 3  │ Croscarmellose │ 7.50 │ kg   │ 2.0%    │ Gran │ │
│  │ 4  │ Mg Stearate    │ 1.50 │ kg   │ 2.0%    │ Lube │ │
│  └────┴────────────────┴──────┴──────┴─────────┴──────┘ │
│                                  [Save & Add Steps]     │
└─────────────────────────────────────────────────────────┘

Screen 4: Manufacturing Steps Builder
┌──────────────────────────────────────────────────────────┐
│  MANUFACTURING STEPS                  [+ Add Step]      │
│                                                         │
│  Step 1: Dispensing                          [Edit] [↕] │
│  ├── Line clearance required: ✅                        │
│  ├── Environmental check: ✅ (20-25°C, ≤65% RH)       │
│  └── Instructions: "Dispense all raw materials..."      │
│                                                         │
│  Step 2: Sifting                             [Edit] [↕] │
│  ├── Equipment type: Vibro Sifter                       │
│  ├── Parameters: Sieve Size (#40 mesh)                  │
│  └── Instructions: "Pass each material through..."      │
│                                                         │
│  Step 3: Dry Mixing                          [Edit] [↕] │
│  ├── Equipment type: RMG                                │
│  ├── Parameters:                                        │
│  │   ├── Impeller Speed: 150 RPM (140-160)             │
│  │   ├── Chopper Speed: OFF                             │
│  │   └── Mixing Time: 10 min (8-12)                    │
│  ├── IPC Checks:                                        │
│  │   └── Blend Uniformity: 90-110% (at end)            │
│  └── Instructions: "Load materials into RMG..."        │
│                                                         │
│  [Continue adding steps...]                             │
│                                  [Save & Submit for Review] │
└─────────────────────────────────────────────────────────┘
```

#### **Workflow 2: Executing a Batch**

```
Screen 1: Batch Initiation
┌──────────────────────────────────────────────────┐
│  START NEW BATCH                                 │
│                                                  │
│  Product: [Amoxicillin 500mg ▼]                 │
│  MBR: [MBR-AMX500-001 v3.2 ▼]                  │
│  Batch Number: [B2024-078] (auto-generated)     │
│  Mfg Date: [2024-11-15]                         │
│  Exp Date: [2026-11-14] (auto-calculated)       │
│                                                  │
│  ⚡ [Initiate Batch]                             │
└──────────────────────────────────────────────────┘

Screen 2: Batch Execution — Step View
┌──────────────────────────────────────────────────────────┐
│  BATCH: B2024-078 │ Amoxicillin 500mg │ Step 3 of 10   │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  PROGRESS: ████████░░░░░░░░░░░░  30%                    │
│                                                         │
│  📋 STEP 3: DRY MIXING                                  │
│  ────────────────────────────────────────────────────    │
│  Instructions: Load sifted materials into the Rapid     │
│  Mixer Granulator. Mix at specified speed and time.      │
│                                                         │
│  ✅ LINE CLEARANCE                                      │
│  ├── [✓] Area clean and free from previous product      │
│  ├── [✓] Equipment clean and labeled                    │
│  └── Cleared by: [E-Sign] ✅ John Smith, 09:15          │
│                                                         │
│  🌡️ ENVIRONMENT                                        │
│  ├── Temperature: [23.5] °C   (20-25°C) ✅             │
│  └── Humidity: [48] %RH       (≤65%) ✅                 │
│                                                         │
│  🔧 EQUIPMENT                                           │
│  └── RMG: [RMG-003 ▼]  Status: Available ✅            │
│                                                         │
│  ⚙️ PROCESS PARAMETERS                                  │
│  ├── Impeller Speed: [152] RPM  (140-160) ✅           │
│  ├── Chopper Speed: [OFF ▼]                             │
│  ├── Mixing Time: [10] min      (8-12) ✅               │
│  ├── Start Time: [09:22] ✅                             │
│  └── End Time: [09:32] ✅                               │
│                                                         │
│  📊 IN-PROCESS CHECKS                                   │
│  ┌────────────────┬──────────┬───────────┬──────────┐   │
│  │ Check          │ Spec     │ Result    │ Status   │   │
│  ├────────────────┼──────────┼───────────┼──────────┤   │
│  │ Blend Uniform. │ 90-110%  │ [102.3]   │ ✅ Pass  │   │
│  └────────────────┴──────────┴───────────┴──────────┘   │
│                                                         │
│  📝 Remarks: [_________________________________]        │
│                                                         │
│  ┌──────────────────┐  ┌──────────────────────────┐    │
│  │ ✍️ Performed By   │  │ ✍️ Verified By            │    │
│  │ [Enter PIN: ****] │  │ [Enter PIN: ****]        │    │
│  │ [Sign]            │  │ [Sign]                   │    │
│  └──────────────────┘  └──────────────────────────┘    │
│                                                         │
│  🤖 AI INSIGHT: "Parameters consistent with last 5      │
│     batches. Blend uniformity result is excellent."     │
│                                                         │
│  [← Previous Step]              [Complete & Next Step →] │
└─────────────────────────────────────────────────────────┘

Screen 3: Out-of-Spec Alert (triggers deviation)
┌──────────────────────────────────────────────────────────┐
│  ⚠️ OUT OF SPECIFICATION ALERT                          │
│  ────────────────────────────────────────────────────    │
│  Parameter: Tablet Hardness                              │
│  Specification: 40-80 N                                  │
│  Entered Value: 38.5 N                                   │
│  Status: ❌ BELOW MINIMUM                                │
│                                                         │
│  A deviation must be recorded to proceed.                │
│                                                         │
│  [Record Deviation]  [Re-check & Re-enter]              │
└──────────────────────────────────────────────────────────┘
```

#### **Workflow 3: AI-Powered Batch Review**

```
Screen: QA Review Dashboard
┌──────────────────────────────────────────────────────────┐
│  QA REVIEW DASHBOARD                                     │
│  ────────────────────────────────────────────────────    │
│  📊 Pending Review: 5 │ In Progress: 2 │ Released: 23  │
│                                                         │
│  ┌──────────┬──────────────┬──────────┬────────┬──────┐ │
│  │ Batch    │ Product      │ Completed│ Devns  │ AI   │ │
│  ├──────────┼──────────────┼──────────┼────────┼──────┤ │
│  │ B2024-078│ Amoxicillin  │ Nov 15   │ 1 ⚠️   │ 🟢   │ │
│  │ B2024-079│ Paracetamol  │ Nov 15   │ 0      │ 🟢   │ │
│  │ B2024-080│ Metformin    │ Nov 14   │ 3 🔴   │ 🔴   │ │
│  └──────────┴──────────────┴──────────┴────────┴──────┘ │
│                                                         │
│  AI Status: 🟢 No issues detected 🔴 Issues flagged     │
│                                                         │
│  [Open Review for B2024-078]                            │
└──────────────────────────────────────────────────────────┘

Screen: AI Review Summary
┌──────────────────────────────────────────────────────────┐
│  🤖 AI BATCH REVIEW — B2024-078                         │
│  ════════════════════════════════════════════════════    │
│                                                         │
│  EXECUTIVE SUMMARY:                                     │
│  ──────────────────                                     │
│  Batch B2024-078 (Amoxicillin 500mg) completed on       │
│  Nov 15, 2024. Overall assessment: SATISFACTORY with    │
│  1 minor observation.                                   │
│                                                         │
│  ✅ PASSED CHECKS (46/47):                              │
│  • All materials dispensed within tolerance              │
│  • All process parameters within limits                 │
│  • 46 of 47 IPC checks within specification            │
│  • Environmental conditions compliant throughout        │
│  • All signatures complete                              │
│  • Yield: 97.2% (within 95-100% limit)                 │
│                                                         │
│  ⚠️ FLAGGED ITEMS (1):                                  │
│  ┌──────────────────────────────────────────────────┐   │
│  │ ITEM 1: Borderline Hardness Reading              │   │
│  │ Step 8 (Compression), Check at 14:30             │   │
│  │ Value: 39.5 N | Limit: 40-80 N | Status: BORDER │   │
│  │                                                  │   │
│  │ AI Analysis: Value is 0.5N below lower limit.    │   │
│  │ Subsequent checks at 15:00 (45N), 15:30 (48N),  │   │
│  │ 16:00 (46N) all well within spec. Likely         │   │
│  │ transient — possibly during tooling adjustment.   │   │
│  │ A deviation D-2024-023 was recorded and resolved. │   │
│  │                                                  │   │
│  │ Recommendation: ACCEPTABLE — no batch impact.    │   │
│  │ [View Step Details] [View Deviation]             │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  ��� CROSS-BATCH COMPARISON:                             │
│  • This batch yield (97.2%) vs avg (96.8%): Above avg  │
│  • Compression parameters consistent with historical   │
│  • No recurring deviation patterns                      │
│                                                         │
│  🏁 RECOMMENDATION: APPROVE                             │
│                                                         │
│  QA Reviewer Decision:                                  │
│  [✅ Approve] [↩️ Return for Correction] [❌ Reject]    │
│  Comments: [________________________________]           │
│  [✍️ E-Sign & Submit]                                   │
└──────────────────────────────────────────────────────────┘
```

---

### 4.6 AI FEATURES — DETAILED SPECIFICATION

```
┌─────────────────────────────────────────────────────────────────┐
│                     AI FEATURES ARCHITECTURE                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. AI BATCH REVIEWER                                           │
│  ─────────────────                                              │
│  Input: Complete batch record data (all steps, params, IPCs)    │
│  Process: Structured prompt to Claude API analyzing:            │
│    - Material dispensing accuracy                                │
│    - Parameter compliance vs limits                             │
│    - IPC results vs specifications                              │
│    - Yield calculations                                         │
│    - Deviation severity and resolution                          │
│    - Signature completeness                                     │
│    - Timeline consistency                                       │
│  Output: Structured JSON summary + natural language report      │
│  Impact: Reduces QA review from 4-8 hours → 30-60 min         │
│                                                                 │
│  2. ANOMALY DETECTION (Real-time)                               │
│  ────────────────────────────                                   │
│  Input: Current parameter value + historical data               │
│  Process: Statistical analysis + AI pattern matching            │
│    - Compare with last N batches of same product                │
│    - Detect trends (increasing/decreasing)                      │
│    - Flag values that are within spec but unusual               │
│  Output: Warning notifications during batch execution           │
│  Example: "Weight at 502mg is within 475-525mg spec, but       │
│    last 5 readings show upward trend — check hopper level"      │
│                                                                 │
│  3. DEVIATION ASSISTANT                                         │
│  ──────────────────────                                         │
│  Input: Deviation description + batch context                   │
│  Process: AI suggests:                                          │
│    - Similar past deviations                                    │
│    - Probable root causes                                       │
│    - Draft CAPA (Corrective/Preventive Action)                  │
│    - Impact assessment                                          │
│  Output: Pre-filled deviation form for human review             │
│                                                                 │
│  4. NATURAL LANGUAGE QUERYING                                   │
│  ────────────────────────────                                   │
│  Input: User question in plain English                          │
│  Process: Convert to SQL/data query + execute + summarize       │
│  Examples:                                                      │
│    "How many batches of Amoxicillin were rejected last quarter?"│
│    "What's the average yield for Product X?"                    │
│    "Show all deviations related to equipment RMG-003"           │
│  Output: Data tables + charts + natural language answer         │
│                                                                 │
│  5. MBR IMPORT ASSISTANT                                        │
│  ─────────────────────                                          │
│  Input: Scanned PDF or text of paper MBR                        │
│  Process: AI extracts and structures:                           │
│    - Bill of materials                                          │
│    - Steps and instructions                                     │
│    - Parameters and limits                                      │
│    - IPC specifications                                         │
│  Output: Pre-populated MBR template for human verification      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### 4.7 TECH STACK FOR MVP

```
FRONTEND:
├── Next.js 14 (App Router)
├── TypeScript
├── Tailwind CSS + shadcn/ui
├── React Hook Form (complex forms)
├── TanStack Table (data tables)
├── Recharts (charts/analytics)
└── React-PDF (PDF generation)

BACKEND:
├─�� Next.js API Routes (or separate Node.js/Express)
├── TypeScript
├── Prisma ORM (PostgreSQL)
├── NextAuth.js (authentication)
├── Zod (validation)
└── Bull/BullMQ (background jobs for AI processing)

DATABASE:
├── PostgreSQL (primary — relational, ACID compliant, perfect for GMP)
├── Redis (sessions, caching, job queues)
└── S3/MinIO (document storage, PDF archives)

AI:
├── Anthropic Claude API (primary AI engine)
├── Structured prompts for each AI feature
└── Token usage tracking per organization

INFRASTRUCTURE:
├── Vercel or AWS (hosting)
├── AWS RDS or Supabase (PostgreSQL)
├── AWS S3 (file storage)
└── SendGrid/AWS SES (email notifications)

SECURITY:
├── bcrypt (password hashing)
├── JWT + refresh tokens
├── Rate limiting
├── CORS configuration
├── Input sanitization
├── Row-Level Security (multi-tenant data isolation)
└── HTTPS everywhere
```

---

### 4.8 MVP SCOPE (What to Build First)

```
PHASE 1 — MVP (4-6 weeks with Claude Code):
═══════════════════════════════════════════
✅ Auth + User Management (with roles)
✅ Product Management (CRUD)
✅ Material Management (CRUD)
✅ Equipment Management (CRUD)
✅ Master Batch Record Builder (full template creation)
✅ Batch Execution (step-by-step with validation)
✅ Electronic Signatures (PIN-based)
✅ Audit Trail (complete, immutable)
✅ Deviation Logging (basic)
✅ Review & Approval Workflow (3-stage)
✅ AI Batch Review Summary
✅ Dashboard (basic metrics)
✅ Batch Record PDF Export

PHASE 2 — Enhanced (Post-MVP):
═══════════════════════════════
◻️ AI Anomaly Detection (real-time)
◻️ AI Chat Assistant
◻️ AI MBR Import from PDF
◻️ Advanced Analytics & Trending
◻️ Multi-site support
◻️ API for equipment integration
◻️ Mobile-optimized operator view
◻️ Notification system (email/SMS)
◻️ Document management (SOPs, COAs)
◻️ Full CAPA management

PHASE 3 — Enterprise:
═══════════════════════
◻️ Integration with ERP (SAP, Oracle)
◻️ Integration with LIMS
◻️ PLC/SCADA data capture
◻️ Environmental monitoring system integration
◻️ Validation documentation generator
◻️ Multi-language support
◻️ Offline mode for tablets
◻️ Barcode/QR scanning
```

---

### 4.9 MONETIZATION MODEL

```
PRICING TIERS:
─────────────

STARTER — $499/month
├── Up to 50 batches/month
├── 5 users
├── 1 product line
├── Basic AI review (10 reviews/month)
├── Email support
└── Target: Small pharma, contract manufacturers

PROFESSIONAL — $1,499/month
├── Up to 200 batches/month
├── 25 users
├── Unlimited product lines
├── Full AI features (100 reviews/month)
├── Priority support
├── Advanced analytics
└── Target: Mid-size pharma companies

ENTERPRISE — $3,999/month (or custom)
├── Unlimited batches
├── Unlimited users
├── Multi-site
├── Unlimited AI features
├── Dedicated support
├── Custom integrations
├── Validation support
└── Target: Large pharma, multinational

AI ADD-ON — $299/month
├── Additional 100 AI batch reviews
├── AI chat assistant (unlimited)
└── Trend analysis reports
```

---

### 4.10 COMPETITIVE LANDSCAPE

```
EXISTING PLAYERS:
─────────────────
│ Player          │ Price        │ Weakness                    │
├─────────────────┼──────────────┼─────────────────────────────┤
│ MasterControl   │ $50K+/year   │ Expensive, complex, no AI   │
│ Veeva Vault     │ $100K+/year  │ Enterprise only, slow setup │
│ Körber (Werum)  │ $200K+/year  │ MES-level, overkill for SME │
│ BatchMaster     │ $30K+/year   │ Outdated UI, no AI          │
│ Tulip           │ $2K+/month   │ Generic platform, not pharma│
│ ComplianceQuest │ $40K+/year   │ Quality-focused, not MBR    │
│                 │              │                             │
│ YOUR PRODUCT    │ $499-3999/mo │ AI-native, modern UX,       │
│                 │              │ affordable, fast deployment  │
└─────────────────┴──────────────┴─────────────────────────────┘

YOUR DIFFERENTIATORS:
1. AI-NATIVE — Not bolted on, built around AI from day 1
2. AFFORDABLE — 10-50x cheaper than incumbents
3. FAST SETUP — Cloud SaaS, working in days not months
4. MODERN UX — Operators actually enjoy using it
5. SMART REVIEW — AI reduces review time by 80%
```

---

### 4.11 FILE/FOLDER STRUCTURE FOR CLAUDE CODE

```
pharma-ebmr/
├── prisma/
│   └── schema.prisma              # Complete database schema
│
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx         # Dashboard layout with sidebar
│   │   │   ├── page.tsx           # Dashboard home
│   │   │   ├── products/
│   │   │   │   ├── page.tsx       # Product list
│   │   │   │   └── [id]/page.tsx  # Product detail
│   │   │   ├── materials/
│   │   │   │   └── page.tsx
│   │   │   ├── equipment/
│   │   │   │   └── page.tsx
│   │   │   ├── mbr/               # Master Batch Records
│   │   │   │   ├── page.tsx       # MBR list
│   │   │   │   ├── new/page.tsx   # MBR builder
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx   # MBR detail/view
│   │   │   │       └── edit/page.tsx
│   │   │   ├── batches/           # Batch execution
│   │   │   │   ├── page.tsx       # Batch list
│   │   │   │   ├── new/page.tsx   # Initiate batch
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx       # Batch overview
│   │   │   │       ├── execute/page.tsx # Step-by-step execution
│   │   │   │       ├── review/page.tsx  # QA review
│   │   │   │       └── report/page.tsx  # Batch record PDF
│   │   │   ├── deviations/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── audit-trail/
│   │   │   │   └── page.tsx
│   │   │   ├── ai-assistant/
│   │   │   │   └── page.tsx       # AI chat interface
│   │   │   ├── reports/
│   │   │   │   └── page.tsx
│   │   │   └── settings/
│   │   │       ├── users/page.tsx
│   │   │       └── organization/page.tsx
│   │   ├── api/                   # API Routes
│   │   │   ├── auth/
│   │   │   │   ├── login/route.ts
│   │   │   │   ├── register/route.ts
│   │   │   │   └── e-sign/route.ts    # E-signature verification
│   │   │   ├── products/route.ts
│   │   │   ├── materials/route.ts
│   │   │   ├── equipment/route.ts
│   │   │   ├── mbr/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/
│   │   │   │       ├── route.ts
│   │   │   │       ├── materials/route.ts
│   │   │   │       └── steps/route.ts
│   │   │   ├── batches/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/
│   │   │   │       ├── route.ts
│   │   │   │       ├── execute/route.ts
│   │   │   │       ├── materials/route.ts
│   │   │   │       ├── steps/[stepId]/route.ts
│   │   │   │       ├── review/route.ts
│   │   │   │       └── ai-review/route.ts
│   │   │   ├── deviations/route.ts
│   │   │   ├── audit-trail/route.ts
│   │   │   ├── ai/
│   │   │   │   ├── batch-review/route.ts
│   │   │   │   ├── chat/route.ts
│   │   │   │   └── trend-analysis/route.ts
│   │   │   └── reports/
│   │   │       └── batch-record/[id]/route.ts
│   │   └── layout.tsx
│   │
│   ├── components/
│   │   ├── ui/                    # shadcn/ui components
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── Breadcrumb.tsx
│   │   ├── batch/
│   │   │   ├── BatchStepExecutor.tsx   # Main step execution component
│   │   │   ├── ParameterInput.tsx      # With validation
│   │   │   ├── IPCCheckInput.tsx
│   │   │   ├── MaterialDispensing.tsx
│   │   │   ├── LineClearanceChecklist.tsx
│   │   │   ├── YieldCalculator.tsx
│   │   │   └── BatchProgressBar.tsx
│   │   ├── mbr/
│   │   │   ├── MBRStepBuilder.tsx
│   │   │   ├── MaterialSelector.tsx
│   │   │   └── ParameterBuilder.tsx
│   │   ├── review/
│   │   │   ├── AIReviewSummary.tsx
│   │   │   ├── ReviewChecklist.tsx
│   │   │   └── BatchRecordViewer.tsx
│   │   ├── signature/
│   │   │   └── ESignatureModal.tsx     # PIN entry + signature
│   │   ├── deviation/
│   │   │   └── DeviationForm.tsx
│   │   └── ai/
│   │       ├── AIChatInterface.tsx
│   │       └── AIInsightCard.tsx
│   │
│   ├── lib/
│   │   ├── db.ts                  # Prisma client
│   │   ├── auth.ts                # Auth utilities
│   │   ├── audit.ts               # Audit trail logger
│   │   ├── e-signature.ts         # E-signature utilities
│   │   ├── ai.ts                  # Claude API integration
│   │   ├── pdf-generator.ts       # Batch record PDF
│   │   ├── validation.ts          # Parameter validation logic
│   │   ├── batch-number.ts        # Batch number generation
│   │   └── permissions.ts         # RBAC helper
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useBatchExecution.ts
│   │   └── useAuditLog.ts
│   │
│   ├── types/
│   │   └── index.ts               # TypeScript types
│   │
│   └── prompts/                   # AI prompt templates
│       ├── batch-review.ts
│       ├── deviation-analysis.ts
│       ├── trend-analysis.ts
│       └── chat-assistant.ts
│
├── public/
├── .env.local
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
└── README.md
```

---

### 4.12 KEY IMPLEMENTATION NOTES FOR CLAUDE CODE

```
CRITICAL RULES TO FOLLOW:
══════════════════════════

1. AUDIT TRAIL — Every database mutation must log to audit_trail
   - Never use UPDATE without capturing old_value
   - Never allow DELETE on core records (soft delete only)
   - audit_trail table must have NO update/delete operations

2. E-SIGNATURES — Must capture:
   - Full name, employee ID, designation
   - Timestamp (server-side, not client)
   - IP address
   - Meaning of signature (performed/verified/approved)
   - Hash for integrity

3. VALIDATION — All parameter entries validated against limits:
   - Real-time feedback (green/yellow/red)
   - Cannot submit out-of-spec without deviation
   - Calculations auto-verified (yield, reconciliation)

4. SEQUENTIAL WORKFLOW — Batch steps must be sequential:
   - Can't start Step N+1 until Step N is completed and signed
   - Can't complete a step without all required fields filled
   - Can't have same person as "performed by" AND "verified by"

5. MULTI-TENANT — Every query must filter by org_id
   - Row-level security
   - Tenant data completely isolated

6. DATA INTEGRITY — 
   - Timestamps are server-side only
   - Once a step is signed, fields become read-only
   - Reason for change required for any modification
   - Password required for e-signature (separate PIN)

7. AI INTEGRATION —
   - Never let AI make decisions (only recommendations)
   - Human must always approve/reject
   - Log all AI interactions for traceability
   - AI operates on READ-ONLY data access
```

---

This gives you a **complete blueprint** to start building. When you go to Claude Code, you can feed this document as context and build module by module, starting with:

1. **Database schema + Auth** (Day 1-2)
2. **Product/Material/Equipment CRUD** (Day 3-4)
3. **MBR Builder** (Day 5-8)
4. **Batch Execution engine** (Day 9-15) ← This is the heart
5. **E-Signatures + Audit Trail** (Day 16-18)
6. **Review & Approval** (Day 19-22)
7. **AI Integration** (Day 23-27)
8. **Dashboard + Reports** (Day 28-30)