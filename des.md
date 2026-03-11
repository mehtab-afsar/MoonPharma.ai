

# MoonPharma Ontology — Complete Redesign

## The Problem With Your Current Ontology

Your current ontology has the right pieces but lacks **depth, interconnection, and operational purpose**. Let me show you what's missing and then design the complete system.

```
CURRENT STATE                           WHAT IT SHOULD BE
─────────────────────────────           ─────────────────────────────
7 entities (shallow)                    7 entities (deep, with subtypes)
28 attributes (4 per entity)            120+ attributes (real pharma fields)
6 relationships (basic)                 25+ relationships (full graph)
1 process graph (linear)                Multiple process graphs (branching)
Descriptive only                        Foundation for prescriptive
No hierarchy                            Entity inheritance + grouping
No constraints                          Validation rules, dependencies
No lifecycle                            State machines per entity
No computed fields                      Derived attributes, formulas
No templates                            Reusable configuration templates
```

---

## The Complete Ontology Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        ONTOLOGY ENGINE                               │
│                                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │ ENTITIES │  │ATTRIBUTES│  │RELATIONS │  │ PROCESS  │           │
│  │          │◄─┤          │  │          │  │ GRAPHS   │           │
│  │ What     │  │ What     │  │ How they │  │ How work │           │
│  │ exists   │  │ describes│  │ connect  │  │ flows    │           │
│  │          │  │ them     │  │          │  │          │           │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘           │
│       │              │              │              │                 │
│  ┌────▼──────────────▼──────────────▼──────────────▼─────┐         │
│  │                 NEW LAYERS                             │         │
│  │                                                       │         │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────────────┐ │         │
│  │  │LIFECYCLES │  │CONSTRAINTS│  │ COMPUTED FIELDS   │ │         │
│  │  │           │  │           │  │                   │ │         │
│  │  │ State     │  │ Rules &   │  │ Formulas &        │ │         │
│  │  │ machines  │  │ validation│  │ derivations       │ │         │
│  │  └───────────┘  └───────────┘  └───────────────────┘ │         │
│  │                                                       │         │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────────────┐ │         │
│  │  │TEMPLATES  │  │CATEGORIES │  │ AUDIT HOOKS       │ │         │
│  │  │           │  │           │  │                   │ │         │
│  │  │ Reusable  │  │ Grouping &│  │ What gets         │ │         │
│  │  │ configs   │  │ taxonomy  │  │ logged & when     │ │         │
│  │  └───────────┘  └───────────┘  └───────────────────┘ │         │
│  └───────────────────────────────────────────────────────┘         │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Section 1: Entities (Deep Redesign)

### Current: 7 flat entities with 4 attributes each
### Redesigned: 7 core entities + subtypes + grouping + lifecycle

```
┌─────────────────────────────────────────────────────────────────────┐
│  /ontology/entities                                                  │
│                                                                      │
│  ┌─── ENTITY GROUPS ─────────────────────────────────────────────┐  │
│  │                                                                │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌───────────────┐ │  │
│  │  │  MASTER DATA    │  │  OPERATIONS     │  │  QUALITY      │ │  │
│  │  │  ─────────────  │  │  ─────────────  │  │  ───────────  │ │  │
│  │  │  Product        │  │  Batch          │  │  Deviation    │ │  │
│  │  │  Raw Material   │  │  MBR            │  │  IPC Result   │ │  │
│  │  │  Equipment      │  │  Batch Step     │  │  Batch Review │ │  │
│  │  │  Area / Room    │  │                 │  │  CAPA         │ │  │
│  │  │                 │  │                 │  │               │ │  │
│  │  └─────────────────┘  └─────────────────┘  └───────────────┘ │  │
│  │                                                                │  │
│  │  ┌─────────────────┐  ┌─────────────────┐                    │  │
│  │  │  PEOPLE         │  │  DOCUMENTS      │                    │  │
│  │  │  ─────────────  │  │  ─────────────  │                    │  │
│  │  │  User           │  │  SOP            │                    │  │
│  │  │  Role           │  │  Specification  │                    │  │
│  │  │  Department     │  │  Certificate    │                    │  │
│  │  │                 │  │                 │                    │  │
│  │  └─────────────────┘  └─────────────────┘                    │  │
│  │                                                                │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Entity Definition (Enhanced Schema)

```sql
-- ============================================================
-- ENHANCED ENTITY TYPE
-- Now with grouping, lifecycle, icon, color, and metadata
-- ============================================================

CREATE TABLE "OntologyEntity" (
    "id"                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "orgId"             UUID NOT NULL REFERENCES "Organization"("id"),
    
    -- Identity
    "code"              VARCHAR(50) NOT NULL,
    "label"             VARCHAR(100) NOT NULL,
    "pluralLabel"       VARCHAR(100) NOT NULL,
    "description"       TEXT,
    
    -- Grouping
    "group"             VARCHAR(30) NOT NULL DEFAULT 'master_data',
                        -- master_data, operations, quality, people, documents
    "icon"              VARCHAR(50),
    "color"             VARCHAR(7),           -- hex color for UI badges
    
    -- Hierarchy
    "parentEntityId"    UUID REFERENCES "OntologyEntity"("id"),
                        -- e.g. "IPC Result" is a child of "Batch Step"
    
    -- Lifecycle
    "hasLifecycle"      BOOLEAN DEFAULT false,
    "lifecycleId"       UUID REFERENCES "OntologyLifecycle"("id"),
    
    -- Behavior
    "isAuditable"       BOOLEAN DEFAULT true,  -- log changes to audit trail
    "isSoftDelete"      BOOLEAN DEFAULT true,  -- never hard delete
    "isVersioned"       BOOLEAN DEFAULT false,  -- track version history
    "requiresApproval"  BOOLEAN DEFAULT false,  -- needs sign-off to activate
    
    -- Mapping to Prisma (bridge to actual app)
    "prismaModel"       VARCHAR(50),           -- e.g. 'Product', 'Material'
                                                -- null for custom entities
    "appRoute"          VARCHAR(100),          -- e.g. '/products', '/materials'
                                                -- null for custom entities
    
    -- System
    "isSystem"          BOOLEAN DEFAULT false,
    "isActive"          BOOLEAN DEFAULT true,
    "sortOrder"         INTEGER DEFAULT 0,
    "createdAt"         TIMESTAMP DEFAULT NOW(),
    "updatedAt"         TIMESTAMP DEFAULT NOW(),
    
    UNIQUE("orgId", "code")
);
```

### The 15 Default Entities (Seeded Per Org)

```
GROUP: MASTER DATA
──────────────────────────────────────────────────────────────────────
Entity          Code              Prisma Model    Has Lifecycle  Versioned
──────────────────────────────────────────────────────────────────────
Product         product           Product         ✓              ✗
Raw Material    raw_material      Material        ✓              ✗
Equipment       equipment         Equipment       ✓              ✗
Area / Room     area              (new)           ✗              ✗

GROUP: OPERATIONS
──────────────────────────────────────────────────────────────────────
MBR             mbr               MasterBatchRec  ✓              ✓
Batch           batch             Batch           ✓              ✗
Batch Step      batch_step        BatchStepExec   ✓              ✗

GROUP: QUALITY
──────────────────────────────────────────────────────────────────────
Deviation       deviation         Deviation       ✓              ✗
IPC Result      ipc_result        (new)           ✗              ✗
Batch Review    batch_review      BatchReview     ✓              ✗
CAPA            capa              (new)           ✓              ✗

GROUP: PEOPLE
──────────────────────────────────────────────────────────────────────
User            user              User            ✗              ✗
Role            role              (enum)          ✗              ✗
Department      department        (new)           ✗              ✗

GROUP: DOCUMENTS
──────────────────────────────────────────────────────────────────────
SOP             sop               (new)           ✓              ✓
Specification   specification     (new)           ✓              ✓
Certificate     certificate       (new)           ✗              ✗
```

---

## Section 2: Attributes (Deep Redesign)

### Current: 28 attributes (4 per entity, generic)
### Redesigned: 120+ attributes with real pharmaceutical fields

```sql
-- ============================================================
-- ENHANCED ATTRIBUTE
-- Now with validation, dependencies, computed flag, sections
-- ============================================================

CREATE TABLE "OntologyAttribute" (
    "id"                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "orgId"             UUID NOT NULL REFERENCES "Organization"("id"),
    "entityId"          UUID NOT NULL REFERENCES "OntologyEntity"("id") ON DELETE CASCADE,
    
    -- Identity
    "code"              VARCHAR(50) NOT NULL,
    "label"             VARCHAR(200) NOT NULL,
    "description"       TEXT,
    "helpText"          TEXT,                   -- tooltip in forms
    
    -- Data Type
    "dataType"          VARCHAR(20) NOT NULL,
                        -- text, number, boolean, date, datetime,
                        -- select, multiselect, reference, file,
                        -- textarea, email, phone, url, computed
    
    -- UI Grouping
    "section"           VARCHAR(50),            -- group attributes into form sections
                                                -- e.g. "General", "Specifications", "Storage"
    "sectionOrder"      INTEGER DEFAULT 0,
    
    -- Validation
    "isRequired"        BOOLEAN DEFAULT false,
    "isUnique"          BOOLEAN DEFAULT false,
    "minValue"          DECIMAL,               -- for number type
    "maxValue"          DECIMAL,               -- for number type
    "minLength"         INTEGER,               -- for text type
    "maxLength"         INTEGER,               -- for text type
    "pattern"           VARCHAR(200),          -- regex for text validation
    "patternMessage"    VARCHAR(200),          -- custom error message
    
    -- Options (for select/multiselect)
    "options"           JSONB,                 -- [{value, label, color}]
    "lookupCategoryType" VARCHAR(50),          -- or reference a LookupCategory
    
    -- Reference (for reference type)
    "referenceEntityId" UUID REFERENCES "OntologyEntity"("id"),
                                                -- which entity does this point to
    "referenceDisplayAttr" VARCHAR(50),        -- which attribute to show
    
    -- Computed (for computed type)
    "formula"           TEXT,                  -- e.g. "actualYield / theoreticalYield * 100"
    "formulaDependencies" TEXT[],             -- attribute codes this depends on
    
    -- Unit
    "unit"              VARCHAR(30),
    "unitOptions"       TEXT[],               -- if multiple units allowed
    
    -- Default
    "defaultValue"      TEXT,
    "defaultExpression" TEXT,                  -- e.g. "NOW()", "AUTO_INCREMENT"
    
    -- Behavior
    "isSearchable"      BOOLEAN DEFAULT false,
    "isFilterable"      BOOLEAN DEFAULT false,
    "isShownInList"     BOOLEAN DEFAULT true,  -- show in table/list view
    "isShownInDetail"   BOOLEAN DEFAULT true,  -- show in detail view
    "isEditableAfterCreate" BOOLEAN DEFAULT true,
    "isCritical"        BOOLEAN DEFAULT false,  -- OOS triggers deviation
    
    -- Mapping to Prisma (bridge)
    "prismaField"       VARCHAR(50),           -- e.g. 'productName', 'strength'
    
    -- System
    "isSystem"          BOOLEAN DEFAULT false,
    "isActive"          BOOLEAN DEFAULT true,
    "sortOrder"         INTEGER DEFAULT 0,
    "createdAt"         TIMESTAMP DEFAULT NOW(),
    
    UNIQUE("orgId", "entityId", "code")
);
```

### Complete Attribute Map (All 120+ Fields)

#### Product Entity — 16 Attributes

```
SECTION: General Information
────────────────────────────────────────────────────────────────────
Code                 Label                    Type      Required  Prisma Field
────────────────────────────────────────────────────────────────────
product_name         Product Name             text      ✓         productName
generic_name         Generic / INN Name       text      ✓         genericName
product_code         Product Code             text      ✓ unique  (new)
strength             Strength                 text      ✓         strength
dosage_form          Dosage Form              select    ✓         dosageForm
  └─ options: tablet, capsule, syrup, injection, cream, ointment, 
              powder, suspension, drops, inhaler

SECTION: Classification
────────────────────────────────────────────────────────────────────
therapeutic_category Therapeutic Category     select    ✗         therapeuticCategory
  └─ options: analgesic, antibiotic, antifungal, cardiovascular,
              antidiabetic, gastrointestinal, respiratory, other
schedule_category    Schedule Category        select    ✗         scheduleCategory
  └─ options: Schedule_H, Schedule_H1, Schedule_X, OTC, Schedule_G
pharmacopeia         Pharmacopeia Reference   select    ✗         (new)
  └─ options: IP, BP, USP, EP, JP

SECTION: Storage & Handling
────────────────────────────────────────────────────────────────────
shelf_life_months    Shelf Life               number    ✓         shelfLife
  └─ unit: months, min: 1, max: 120
storage_conditions   Storage Conditions       select    ✓         storageConditions
  └─ options: room_temp (15-30°C), cool (8-15°C), 
              refrigerated (2-8°C), frozen (-20°C)
storage_precautions  Storage Precautions      textarea  ✗         (new)
handling_precautions Handling Precautions     textarea  ✗         handlingPrecautions
light_sensitive      Light Sensitive          boolean   ✗         (new)
moisture_sensitive   Moisture Sensitive       boolean   ✗         (new)

SECTION: Regulatory
────────────────────────────────────────────────────────────────────
registration_number  Drug Registration No.    text      ✗         (new)
market_authorization MA Holder               text      ✗         (new)
```

#### Raw Material Entity — 18 Attributes

```
SECTION: Identification
────────────────────────────────────────────────────────────────────
material_code        Material Code            text      ✓ unique  materialCode
material_name        Material Name            text      ✓         materialName
cas_number           CAS Number               text      ✗         (new)
  └─ pattern: "^\d{2,7}-\d{2}-\d$"
  └─ patternMessage: "Format: XXXXX-XX-X"

SECTION: Classification
────────────────────────────────────────────────────────────────────
material_type        Material Type            select    ✓         type
  └─ lookupCategoryType: material_type
grade                Pharmacopeia Grade       select    ✓         grade
  └─ options: IP, BP, USP, EP, JP, In_house, NF
category             Material Category        select    ✗         (new)
  └─ options: api, excipient, packaging_primary, 
              packaging_secondary, consumable, solvent, reagent

SECTION: Supplier
────────────────────────────────────────────────────────────────────
vendor               Approved Vendor          text      ✗         vendor
vendor_code          Vendor Code              text      ✗         (new)
manufacturer_name    Manufacturer             text      ✗         (new)
country_of_origin    Country of Origin        text      ✗         (new)

SECTION: Storage & Handling
────────────────────────────────────────────────────────────────────
storage_condition    Storage Condition        select    ✓         storageCondition
  └─ options: ambient, cool, refrigerated, frozen, desiccator
reorder_level        Reorder Level            number    ✗         reorderLevel
  └─ unit: kg
retest_period_months Retest Period            number    ✗         (new)
  └─ unit: months
hazard_class         Hazard Classification    select    ✗         (new)
  └─ options: non_hazardous, flammable, corrosive, toxic, oxidizer

SECTION: Specifications
────────────────────────────────────────────────────────────────────
assay_min            Assay Minimum            number    ✗         (new)
  └─ unit: %, min: 0, max: 100
assay_max            Assay Maximum            number    ✗         (new)
  └─ unit: %, min: 0, max: 100
lod_limit            LOD Limit (NMT)          number    ✗         (new)
  └─ unit: %, isCritical: true
```

#### Equipment Entity — 17 Attributes

```
SECTION: Identification
────────────────────────────────────────────────────────────────────
equipment_code       Equipment Code           text      ✓ unique  equipmentCode
equipment_name       Equipment Name           text      ✓         equipmentName
equipment_type       Equipment Type           select    ✓         equipmentType
  └─ lookupCategoryType: equipment_type
tag_number           Tag / Asset Number       text      ✗         (new)

SECTION: Technical Details
────────────────────────────────────────────────────────────────────
model                Model                    text      ✗         model
serial_number        Serial Number            text      ✗         serialNumber
manufacturer         Manufacturer             text      ✗         manufacturer
year_of_manufacture  Year of Manufacture      number    ✗         (new)
capacity             Capacity                 text      ✗         (new)
  └─ helpText: "e.g. 300L, 50kg, 100,000 tabs/hr"
power_rating         Power Rating             text      ✗         (new)
  └─ helpText: "e.g. 15 kW, 20 HP"
material_of_construction MOC                  select    ✗         (new)
  └─ options: SS_304, SS_316, SS_316L, HDPE, glass_lined, other

SECTION: Location & Status
────────────────────────────────────────────────────────────────────
location             Location / Area          reference ✗         location
  └─ referenceEntityId: → Area entity
qualification_status Qualification Status     select    ✓         qualificationStatus
  └─ options: not_qualified, IQ_done, OQ_done, PQ_done, qualified, 
              requalification_due, decommissioned
current_status       Current Status           select    ✗         (new)
  └─ options: available, in_use, under_maintenance, 
              under_cleaning, out_of_service

SECTION: Calibration & Maintenance
────────────────────────────────────────────────────────────────────
calibration_due_date Calibration Due Date     date      ✗         calibrationDueDate
last_calibration     Last Calibration Date    date      ✗         (new)
calibration_frequency Calibration Frequency   select    ✗         (new)
  └─ options: monthly, quarterly, semi_annual, annual
next_maintenance     Next PM Due Date         date      ✗         (new)
```

#### Area Entity — 10 Attributes (New Entity)

```
SECTION: Identification
────────────────────────────────────────────────────────────────────
area_code            Area Code                text      ✓ unique
area_name            Area Name                text      ✓
area_type            Area Type                select    ✓
  └─ options: production, packaging, warehouse, qc_lab, 
              utility, corridor, gowning, airlock

SECTION: Classification
────────────────────────────────────────────────────────────────────
cleanliness_class    Cleanliness Class        select    ✓
  └─ lookupCategoryType: area_class
parent_area          Parent Area              reference ✗
  └─ referenceEntityId: → Area (self-reference, hierarchy)
floor                Floor / Level            text      ✗
building             Building                 text      ✗

SECTION: Environmental Controls
────────────────────────────────────────────────────────────────────
temp_range           Temperature Range        text      ✗
  └─ helpText: "e.g. 20-25°C"
humidity_range        Humidity Range           text      ✗
  └─ helpText: "e.g. 45-65% RH"
pressure_differential Pressure Differential   select    ✗
  └─ options: positive, negative, neutral
```

#### MBR Entity — 15 Attributes

```
SECTION: Identification
────────────────────────────────────────────────────────────────────
mbr_code             MBR Code                 text      ✓ unique  mbrCode
version              Version                  number    ✓         version
  └─ defaultExpression: "1"
product              Product                  reference ✓         productId
  └─ referenceEntityId: → Product
  └─ referenceDisplayAttr: product_name

SECTION: Batch Parameters
────────────────────────────────────────────────────────────────────
batch_size_value     Batch Size               number    ✓         batchSizeValue
batch_size_unit      Batch Size Unit          select    ✓         batchSizeUnit
  └─ options: kg, L, nos, units
theoretical_yield    Theoretical Yield        number    ✓         theoreticalYieldValue
theoretical_yield_unit Yield Unit             select    ✓         theoreticalYieldUnit
  └─ options: kg, L, nos, units
yield_limit_min      Yield Limit Min          number    ✓         yieldLimitMin
  └─ unit: %, defaultValue: "95"
yield_limit_max      Yield Limit Max          number    ✓         yieldLimitMax
  └─ unit: %, defaultValue: "105"

SECTION: Validity
────────────────────────────────────────────────────────────────────
effective_date       Effective Date           date      ✗         effectiveDate
review_date          Review Date              date      ✗         reviewDate
supersedes           Supersedes MBR           reference ✗         (new)
  └─ referenceEntityId: → MBR

SECTION: Approval
────────────────────────────────────────────────────────────────────
status               Status                   select    ✓         status
  └─ options: draft, pending_review, approved, superseded, obsolete
created_by           Created By               reference ✓         createdById
  └─ referenceEntityId: → User
approved_by          Approved By              reference ✗         approvedById
  └─ referenceEntityId: → User
```

#### Batch Entity — 18 Attributes

```
SECTION: Identification
────────────────────────────────────────────────────────────────────
batch_number         Batch Number             text      ✓ unique  batchNumber
  └─ defaultExpression: "AUTO_INCREMENT"
mbr                  Master Batch Record      reference ✓         mbrId
  └─ referenceEntityId: → MBR
product_name         Product Name             computed  ✓
  └─ formula: "mbr.product.product_name"
  └─ formulaDependencies: ["mbr"]

SECTION: Schedule
────────────────────────────────────────────────────────────────────
manufacturing_date   Manufacturing Date       date      ✓         manufacturingDate
expiry_date          Expiry Date              date      ✓         expiryDate
  └─ formula: "manufacturing_date + product.shelf_life_months"
planned_start        Planned Start            datetime  ✗         (new)
planned_end          Planned End              datetime  ✗         (new)

SECTION: Execution
────────────────────────────────────────────────────────────────────
status               Status                   select    ✓         status
  └─ options: planned, in_progress, on_hold, under_review, 
              approved, rejected, cancelled
current_step         Current Step             number    ✗         currentStepNumber
initiated_by         Initiated By             reference ✓         initiatedById
  └─ referenceEntityId: → User
started_at           Started At               datetime  ✗         startedAt
completed_at         Completed At             datetime  ✗         completedAt

SECTION: Yield
────────────────────────────────────────────────────────────────────
actual_yield         Actual Yield             number    ✗         actualYieldValue
actual_yield_unit    Yield Unit               select    ✗         actualYieldUnit
yield_percentage     Yield %                  computed  ✗         yieldPercentage
  └─ formula: "(actual_yield / mbr.theoretical_yield) * 100"
  └─ isCritical: true
yield_status         Yield Status             computed  ✗
  └─ formula: "yield_percentage >= mbr.yield_limit_min 
               AND yield_percentage <= mbr.yield_limit_max 
               ? 'PASS' : 'FAIL'"

SECTION: Summary
────────────────────────────────────────────────────────────────────
deviation_count      Deviations               computed  ✗
  └─ formula: "COUNT(deviations WHERE batch = this)"
review_status        Review Progress          computed  ✗
  └─ formula: "approved_reviews / total_review_stages"
```

#### Deviation Entity — 16 Attributes

```
SECTION: Identification
────────────────────────────────────────────────────────────────────
deviation_number     Deviation Number         text      ✓ unique  deviationNumber
  └─ defaultExpression: "AUTO_INCREMENT"
title                Title                    text      ✓         title
description          Description              textarea  ✓         description
batch                Related Batch            reference ✗         batchId
  └─ referenceEntityId: → Batch
batch_step           Related Step             number    ✗         (new)

SECTION: Classification
────────────────────────────────────────────────────────────────────
category             Category                 select    ✓         category
  └─ lookupCategoryType: deviation_category
severity             Severity                 select    ✓         severity
  └─ options: [{value:"minor", color:"#6B7280"}, 
               {value:"major", color:"#F59E0B"}, 
               {value:"critical", color:"#EF4444"}]
source               Source                   select    ✓         (new)
  └─ options: manual, auto_oos, auto_yield, audit_finding

SECTION: Investigation
────────────────────────────────────────────────────────────────────
status               Status                   select    ✓         status
  └─ options: open, under_investigation, pending_capa, closed
root_cause           Root Cause               textarea  ✗         rootCause
root_cause_category  Root Cause Category      select    ✗         (new)
  └─ options: human_error, equipment_failure, process_gap, 
              material_defect, environmental, design_flaw

SECTION: CAPA
────────────────────────────────────────────────────────────────────
corrective_action    Corrective Action        textarea  ✗         correctiveAction
preventive_action    Preventive Action        textarea  ✗         preventiveAction
capa_due_date        CAPA Due Date            date      ✗         (new)
capa_status          CAPA Status              select    ✗         (new)
  └─ options: not_required, pending, in_progress, completed, verified

SECTION: People & Dates
────────────────────────────────────────────────────────────────────
detected_by          Detected By              reference ✓         detectedById
assigned_to          Assigned To              reference ✗         assignedToId
detected_at          Detected At              datetime  ✓         detectedAt
closed_at            Closed At                datetime  ✗         closedAt
```

---

## Section 3: Relationships (Complete Graph)

### Current: 6 basic relationships
### Redesigned: 25 relationships covering the full domain

```sql
-- ============================================================
-- ENHANCED RELATIONSHIP
-- Now with cardinality, constraints, and bridge entity support
-- ============================================================

CREATE TABLE "OntologyRelationship" (
    "id"                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "orgId"                 UUID NOT NULL REFERENCES "Organization"("id"),
    
    -- Endpoints
    "sourceEntityId"        UUID NOT NULL REFERENCES "OntologyEntity"("id"),
    "targetEntityId"        UUID NOT NULL REFERENCES "OntologyEntity"("id"),
    
    -- Semantics
    "code"                  VARCHAR(50) NOT NULL,
    "forwardLabel"          VARCHAR(100) NOT NULL, -- "Product → has → MBR"
    "reverseLabel"          VARCHAR(100) NOT NULL, -- "MBR → belongs to → Product"
    
    -- Cardinality
    "cardinality"           VARCHAR(20) NOT NULL,
                            -- one_to_one, one_to_many, many_to_many
    "isRequired"            BOOLEAN DEFAULT false, -- target required for source?
    
    -- Constraints
    "minCount"              INTEGER,               -- minimum related records
    "maxCount"              INTEGER,               -- maximum related records
    "cascadeDelete"         BOOLEAN DEFAULT false,
    
    -- Bridge (for many-to-many with attributes)
    "hasBridgeEntity"       BOOLEAN DEFAULT false,
    "bridgeEntityId"        UUID REFERENCES "OntologyEntity"("id"),
    
    -- Mapping
    "prismaRelation"        VARCHAR(50),          -- e.g. 'product', 'mbrId'
    
    -- System
    "isSystem"              BOOLEAN DEFAULT false,
    "isActive"              BOOLEAN DEFAULT true,
    "createdAt"             TIMESTAMP DEFAULT NOW(),
    
    UNIQUE("orgId", "code")
);
```

### The Complete Relationship Map

```
MASTER DATA RELATIONSHIPS
═══════════════════════════════════════════════════════════════════

1.  Product ──[has_mbr]──────────────────► MBR
    "has Master Batch Records"              "is recipe for"
    one_to_many, required: false

2.  Product ──[has_specification]──────────► Specification
    "has specifications"                    "specifies"
    one_to_many

3.  Raw Material ──[supplied_by]───────────► Vendor (custom entity)
    "is supplied by"                        "supplies"
    many_to_many

4.  Equipment ──[located_in]───────────────► Area
    "is located in"                         "contains equipment"
    many_to_one

5.  Equipment ──[has_sop]──────────────────► SOP
    "has operating SOP"                     "applies to"
    many_to_many

6.  Area ──[parent_area]───────────────────► Area (self-reference)
    "is within"                             "contains sub-areas"
    many_to_one


OPERATIONS RELATIONSHIPS
═══════════════════════════════════════════════════════════════════

7.  MBR ──[has_batch]──────────────────────► Batch
    "has batches"                           "follows recipe"
    one_to_many, required: true

8.  MBR ──[requires_material]──────────────► Raw Material
    "requires materials (BOM)"              "is used in"
    many_to_many, hasBridge: true
    bridgeEntity: MBR Material (qty, tolerance, unit)

9.  MBR ──[has_step]───────────────────────► MBR Step (implicit)
    "has manufacturing steps"               "belongs to"
    one_to_many

10. MBR ──[requires_equipment]─────────────► Equipment
    "requires equipment"                    "is used for"
    many_to_many, hasBridge: true
    bridgeEntity: MBR Equipment (step, notes)

11. Batch ──[has_step_execution]───────────► Batch Step
    "has step executions"                   "belongs to batch"
    one_to_many

12. Batch ──[uses_material]────────────────► Raw Material
    "uses materials"                        "is consumed in"
    many_to_many, hasBridge: true
    bridgeEntity: Batch Material Usage (lot, qty, AR number)

13. Batch ──[uses_equipment]───────────────► Equipment
    "uses equipment"                        "is used in batch"
    many_to_many

14. Batch ──[manufactured_in]──────────────► Area
    "is manufactured in"                    "hosts batch"
    many_to_one


QUALITY RELATIONSHIPS
═══════════════════════════════════════════════════════════════════

15. Batch ──[has_deviation]────────────────► Deviation
    "has deviations"                        "raised against"
    one_to_many

16. Batch ──[has_review]───────────────────► Batch Review
    "has reviews"                           "reviews batch"
    one_to_many

17. Batch Step ──[has_ipc]─────────────────► IPC Result
    "has IPC results"                       "checked at step"
    one_to_many

18. Deviation ──[has_capa]─────────────────► CAPA
    "has CAPA"                              "addresses deviation"
    one_to_one

19. Deviation ──[triggers_hold]────────────► Batch
    "triggers hold on"                      "is held due to"
    many_to_one (conditional: severity = critical)


PEOPLE RELATIONSHIPS
═══════════════════════════════════════════════════════════════════

20. User ──[initiates]─────────────────────► Batch
    "initiates batches"                     "initiated by"
    one_to_many

21. User ──[performs_step]─────────────────► Batch Step
    "performs steps"                         "performed by"
    one_to_many

22. User ──[verifies_step]─────────────────► Batch Step
    "verifies steps"                        "verified by"
    one_to_many

23. User ──[reviews]───────────────────────► Batch Review
    "reviews batches"                       "reviewed by"
    one_to_many

24. User ──[detects_deviation]─────────────► Deviation
    "detects deviations"                    "detected by"
    one_to_many

25. User ──[belongs_to_dept]───────────────► Department
    "belongs to"                            "has members"
    many_to_one
```

### Relationship Visualization (What the UI Should Show)

```
┌─────────────────────────────────────────────────────────────────────┐
│  /ontology/relationships                                             │
│                                                                      │
│  VIEW: [Graph ●] [Table] [Matrix]                                   │
│                                                                      │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                                                               │  │
│  │              ┌──────────┐                                     │  │
│  │              │ Product  │                                     │  │
│  │              └────┬─────┘                                     │  │
│  │                   │ has_mbr (1:N)                              │  │
│  │                   ▼                                            │  │
│  │  ┌────────┐  ┌────────┐  ┌────────────┐                      │  │
│  │  │Material├──┤  MBR   ├──┤ Equipment  │                      │  │
│  │  └───┬────┘  └────┬───┘  └──────┬─────┘                      │  │
│  │      │            │ has_batch    │                             │  │
│  │      │ uses       ▼   (1:N)     │ uses                        │  │
│  │      │       ┌────────┐         │                             │  │
│  │      └──────►│ Batch  │◄────────┘                             │  │
│  │              └┬──┬──┬─┘                                       │  │
│  │               │  │  │                                         │  │
│  │     has_step  │  │  │ has_deviation                           │  │
│  │               ▼  │  ▼                                         │  │
│  │  ┌──────────┐ │  │ ┌───────────┐                             │  │
│  │  │Batch Step│ │  │ │ Deviation │──► CAPA                     │  │
│  │  └────┬─────┘ │  │ └───────────┘                             │  │
│  │       │       │  │                                            │  │
│  │  has_ipc   has_review                                         │  │
│  │       ▼       ▼                                               │  │
│  │  ┌────────┐ ┌──────────┐                                     │  │
│  │  │IPC Res │ │Batch Rev │                                     │  │
│  │  └────────┘ └──────────┘                                     │  │
│  │                                                               │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  Click any line → shows relationship details                        │
│  Click any node → navigates to entity detail                        │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Section 4: Lifecycles (New)

This is completely missing from your current system. Every GMP entity has a defined state machine.

```sql
-- ============================================================
-- LIFECYCLE (State Machine per Entity)
-- ============================================================

CREATE TABLE "OntologyLifecycle" (
    "id"            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "orgId"         UUID NOT NULL REFERENCES "Organization"("id"),
    "entityId"      UUID NOT NULL REFERENCES "OntologyEntity"("id"),
    "name"          VARCHAR(100) NOT NULL,
    "description"   TEXT,
    "isSystem"      BOOLEAN DEFAULT false,
    "createdAt"     TIMESTAMP DEFAULT NOW(),
    
    UNIQUE("orgId", "entityId")
);

CREATE TABLE "OntologyLifecycleState" (
    "id"            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "lifecycleId"   UUID NOT NULL REFERENCES "OntologyLifecycle"("id") ON DELETE CASCADE,
    "code"          VARCHAR(30) NOT NULL,
    "label"         VARCHAR(50) NOT NULL,
    "description"   TEXT,
    "color"         VARCHAR(7),             -- hex for UI
    "isInitial"     BOOLEAN DEFAULT false,  -- entry state
    "isTerminal"    BOOLEAN DEFAULT false,  -- end state (no transitions out)
    "sortOrder"     INTEGER DEFAULT 0,
    
    UNIQUE("lifecycleId", "code")
);

CREATE TABLE "OntologyLifecycleTransition" (
    "id"            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "lifecycleId"   UUID NOT NULL REFERENCES "OntologyLifecycle"("id") ON DELETE CASCADE,
    "fromStateId"   UUID NOT NULL REFERENCES "OntologyLifecycleState"("id"),
    "toStateId"     UUID NOT NULL REFERENCES "OntologyLifecycleState"("id"),
    "action"        VARCHAR(50) NOT NULL,   -- verb: "approve", "reject", "start"
    "label"         VARCHAR(100) NOT NULL,  -- "Submit for Review"
    
    -- Guards
    "requiredRole"  TEXT[],                 -- which roles can trigger this
    "requiresSignature" BOOLEAN DEFAULT false,
    "requiresComment"   BOOLEAN DEFAULT false,
    "requiresVerification" BOOLEAN DEFAULT false, -- two-person rule
    
    -- Side Effects
    "autoCreateDeviation" BOOLEAN DEFAULT false,  -- on certain transitions
    "notifyRoles"   TEXT[],                       -- who gets notified
    
    "isSystem"      BOOLEAN DEFAULT false,
    "createdAt"     TIMESTAMP DEFAULT NOW()
);
```

### Default Lifecycles

#### Batch Lifecycle

```
┌─────────────────────────────────────────────────────────────────────┐
│  BATCH LIFECYCLE                                                     │
│                                                                      │
│  ┌─────────┐  start   ┌─────────────┐  submit  ┌──────────────┐   │
│  │ PLANNED │─────────►│ IN_PROGRESS │────────►│ UNDER_REVIEW │   │
│  │ (init)  │          │             │          │              │   │
│  └─────────┘          └──────┬──────┘          └───┬──┬───────┘   │
│                              │                     │  │            │
│                         hold │               reject│  │approve     │
│                              ▼                     │  │            │
│                        ┌──────────┐                │  ▼            │
│                        │ ON_HOLD  │                │ ┌──────────┐  │
│                        │          │                │ │ APPROVED │  │
│                        └────┬─────┘                │ │ (term)   │  │
│                             │ resume               │ └──────────┘  │
│                             ▼                      │               │
│                        ┌──────────────┐            ▼               │
│                        │ IN_PROGRESS  │      ┌──────────┐         │
│                        │ (return)     │      │ REJECTED │         │
│                        └──────────────┘      │ (term)   │         │
│                                              └──────────┘         │
│                                                                    │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │ TRANSITIONS                                                │   │
│  │                                                            │   │
│  │ planned → in_progress  │ start    │ prod roles  │ sig: ✗  │   │
│  │ in_progress → on_hold  │ hold     │ all         │ sig: ✓  │   │
│  │ on_hold → in_progress  │ resume   │ qa roles    │ sig: ✓  │   │
│  │ in_progress → review   │ submit   │ prod roles  │ sig: ✓  │   │
│  │ review → approved      │ approve  │ qa_head     │ sig: ✓  │   │
│  │ review → rejected      │ reject   │ qa roles    │ sig: ✓  │   │
│  │ review → in_progress   │ return   │ qa roles    │ sig: ✓  │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                    │
└─────────────────────────────────────────────────────────────────────┘
```

#### MBR Lifecycle

```
┌────────┐  submit  ┌────────────────┐  approve  ┌──────────┐
│ DRAFT  │────────►│ PENDING_REVIEW │──────────►│ APPROVED │
│ (init) │         │                │           │          │
└────────┘         └───────┬────────┘           └────┬─────┘
                           │ reject                  │ supersede
                           ▼                         ▼
                     ┌──────────┐             ┌────────────┐
                     │ DRAFT    │             │ SUPERSEDED │
                     │ (return) │             │ (term)     │
                     └──────────┘             └────────────┘
```

#### Deviation Lifecycle

```
┌──────┐  investigate  ┌─────────────────────┐  add_capa  ┌──────────────┐
│ OPEN │──────────────►│ UNDER_INVESTIGATION │──────────►│ PENDING_CAPA │
│(init)│               │                     │           │              │
└──────┘               └─────────────────────┘           └──────┬───────┘
                                                                │ close
                                                                ▼
                                                         ┌──────────┐
                                                         │ CLOSED   │
                                                         │ (term)   │
                                                         └──────────┘
```

#### Equipment Lifecycle

```
┌───────────────┐  qualify  ┌───────────┐  maintenance  ┌──────────────────┐
│ NOT_QUALIFIED │─────────►│ QUALIFIED │─────────────►│ UNDER_MAINTENANCE│
│ (init)        │          │           │              ���                  │
└───────────────┘          └─────┬─────┘              └────────┬─────────┘
                                 │ decommission               │ requalify
                                 ▼                            ▼
                          ┌────────────────┐           ┌───────────┐
                          │ DECOMMISSIONED │           │ QUALIFIED │
                          │ (term)         │           │ (return)  │
                          └────────────────┘           └───────────┘
```

---

## Section 5: Process Graphs (Enhanced)

### Current: 1 linear graph with 7 nodes
### Redesigned: Multiple graphs with branching, conditions, and swim lanes

```sql
-- ============================================================
-- ENHANCED PROCESS GRAPH
-- Now with node types, conditions, swim lanes, and variables
-- ============================================================

CREATE TABLE "OntologyProcessGraph" (
    "id"            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "orgId"         UUID NOT NULL REFERENCES "Organization"("id"),
    "code"          VARCHAR(50) NOT NULL,
    "name"          VARCHAR(200) NOT NULL,
    "description"   TEXT,
    "category"      VARCHAR(30) NOT NULL,
                    -- manufacturing, quality, packaging, utility
    "version"       INTEGER DEFAULT 1,
    "status"        VARCHAR(20) DEFAULT 'draft',
                    -- draft, active, archived
    "isSystem"      BOOLEAN DEFAULT false,
    "createdAt"     TIMESTAMP DEFAULT NOW(),
    "updatedAt"     TIMESTAMP DEFAULT NOW(),
    
    UNIQUE("orgId", "code", "version")
);

CREATE TABLE "OntologyProcessNode" (
    "id"            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "graphId"       UUID NOT NULL REFERENCES "OntologyProcessGraph"("id") ON DELETE CASCADE,
    
    -- Identity
    "code"          VARCHAR(50) NOT NULL,
    "label"         VARCHAR(200) NOT NULL,
    "description"   TEXT,
    
    -- Type
    "nodeType"      VARCHAR(20) NOT NULL,
                    -- start, end, process, decision, parallel_start, 
                    -- parallel_end, wait, manual, automatic, subprocess
    
    -- Visual (React Flow)
    "positionX"     FLOAT NOT NULL,
    "positionY"     FLOAT NOT NULL,
    "width"         FLOAT DEFAULT 200,
    "height"        FLOAT DEFAULT 80,
    
    -- Swim Lane
    "swimLane"      VARCHAR(50),           -- which role/department owns this
                                            -- e.g. "production", "qa", "warehouse"
    
    -- Linked Entity
    "entityCode"    VARCHAR(50),           -- which entity this node operates on
    "lifecycleTransition" VARCHAR(50),     -- which transition this triggers
    
    -- Timing
    "estimatedDuration" INTEGER,           -- minutes
    "slaMinutes"    INTEGER,               -- max allowed time
    
    -- Config
    "requiresSignature" BOOLEAN DEFAULT false,
    "requiresVerification" BOOLEAN DEFAULT false,
    "isOptional"    BOOLEAN DEFAULT false,
    
    "createdAt"     TIMESTAMP DEFAULT NOW()
);

CREATE TABLE "OntologyProcessEdge" (
    "id"            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "graphId"       UUID NOT NULL REFERENCES "OntologyProcessGraph"("id") ON DELETE CASCADE,
    "sourceNodeId"  UUID NOT NULL REFERENCES "OntologyProcessNode"("id") ON DELETE CASCADE,
    "targetNodeId"  UUID NOT NULL REFERENCES "OntologyProcessNode"("id") ON DELETE CASCADE,
    
    -- Condition (for decision nodes)
    "condition"     TEXT,                   -- e.g. "yield_percentage >= 95"
    "conditionLabel" VARCHAR(100),         -- e.g. "Pass", "Fail"
    
    -- Visual
    "edgeType"      VARCHAR(20) DEFAULT 'default',
                    -- default, conditional_yes, conditional_no, parallel
    "animated"      BOOLEAN DEFAULT false,
    
    "createdAt"     TIMESTAMP DEFAULT NOW()
);
```

### Default Process Graph: Complete Manufacturing Workflow

```
┌─────────────────────────────────────────────────────────────────────────┐
│  MANUFACTURING WORKFLOW (with swim lanes)                                │
│                                                                          │
│  WAREHOUSE    │  PRODUCTION         │  QC / IPC        │  QA            │
│  ─────────────│─────────────────────│──────────────────│────────────────│
│               │                     │                  │                │
│  ┌─────────┐ │                     │                  │                │
│  │  START  │ │                     │                  │                │
│  └────┬────┘ │                     │                  │                │
│       │      │                     │                  │                │
│       ▼      │                     │                  │                │
│  ┌─────────┐ │                     │                  │                │
│  │Material │ │                     │                  │                │
│  │Dispensing│─┼──────┐             │                  │                │
│  │ ⚡ sig  │ │      │             │                  │                │
│  └─────────┘ │      ▼             │                  │                │
│               │ ┌──────────┐      │                  │                │
│               │ │  Line    │      │                  │                │
│               │ │Clearance │      │                  │                │
│               │ │ ⚡ sig   │      │                  │                │
│               │ └────┬─────┘      │                  │                │
│               │      │            │                  │                │
│               │      ▼            │                  │                │
│               │ ┌──────────┐      │                  │                │
│               │ │Manufactur│      │                  │                │
│               │ │ing Steps │      │                  │                │
│               │ │ ⚡ verify │──────┼──┐               │                │
│               │ └────┬─────┘      │  │               │                │
│               │      │            │  ▼               │                │
│               │      │            │ ┌──────────┐     │                │
│               │      │            │ │IPC Check │     │                │
│               │      │            │ │          │     │                │
│               │      │            │ └────┬─────┘     │                │
│               │      │            │      │           │                │
│               │      │            │ ┌────▼─────┐     │                │
│               │      │            │ │ IPC Pass?│     │                │
│               │      │            │ └──┬────┬──┘     │                │
│               │      │            │ Yes│    │No      │                │
│               │      │◄───────────┼────┘    │        │                │
│               │      │            │         ▼        │                │
│               │      │            │ ┌──────────┐     │                │
│               │      │            │ │Deviation │─────┼──┐             │
│               │      │            │ │Raised    │     │  │             │
│               │      │            │ └──────────┘     │  │             │
│               │      │            │                  │  │             │
│               │      ▼            │                  │  │             │
│               │ ┌──────────┐      │                  │  │             │
│               │ │Yield     │      │                  │  │             │
│               │ │Calculate │      │                  │  │             │
│               │ └────┬─────┘      │                  │  │             │
│               │ ┌────▼─────┐      │                  │  │             │
│               │ │Yield OK? │      │                  │  │             │
│               │ └──┬────┬──┘      │                  │  │             │
│               │ Yes│    │No       │                  │  │             │
│               │    │    ▼         │                  │  │             │
│               │    │ ┌──────┐    │                  │  │             │
│               │    │ │OOS   │────┼──────────────────┼──┤             │
│               │    │ │Devn  │    │                  │  │             │
│               │    │ └──────┘    │                  │  │             │
│               │    │             │                  │  │             │
│               │    ▼             │                  │  ▼             │
│               │ ┌──────────┐    │                  │ ┌───────────┐  │
│               │ │Packaging │    │                  │ │Production │  │
│               │ │          │    │                  │ │Review     │  │
│               │ │ ⚡ verify │    │                  │ │ ⚡ sig     │  │
│               │ └────┬─────┘    │                  │ └─────┬─────┘  │
│               │      │          │                  │       │        │
│               │      │          │                  │       ▼        │
│               │      │          │                  │ ┌───────────┐  │
│               │      │          │                  │ │QA Review  │  │
│               │      │          │                  │ │ ⚡ sig     │  │
│               │      │          │                  │ └─────┬─────┘  │
│               │      │          │                  │       │        │
│               │      │          │                  │       ▼        │
│               │      │          │                  │ ┌───────────┐  │
│               │      │          │                  │ │QA Head    │  │
│               │      │          │                  │ │Approval   │  │
│               │      │          │                  │ │ ⚡ sig     │  │
│               │      │          │                  │ └─────┬─────┘  │
│               │      │          │                  │  ┌────▼────┐   │
│               │      │          │                  │  │Approved?│   │
│               │      │          │                  │  └─┬─────┬─┘   │
│               │      │          │                  │ Yes│     │No   │
│               │      │          │                  │    ▼     ▼     │
│               │      │          │                  │ ┌─────┐┌────┐ │
│               │      │          │                  │ │PASS ││FAIL│ │
│               │      │          │                  │ │ ✓   ││ ✗  │ │
│               │      │          │                  │ └─────┘└────┘ │
│               │      │          │                  │               │
│  ─────────────│──────│──────────│──────────────────│───────────────│
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Section 6: Constraints & Validation Rules (New)

```sql
-- ============================================================
-- CONSTRAINTS
-- Business rules that the ontology enforces
-- ============================================================

CREATE TABLE "OntologyConstraint" (
    "id"            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "orgId"         UUID NOT NULL REFERENCES "Organization"("id"),
    "entityId"      UUID NOT NULL REFERENCES "OntologyEntity"("id"),
    
    "code"          VARCHAR(50) NOT NULL,
    "name"          VARCHAR(200) NOT NULL,
    "description"   TEXT,
    
    -- Type
    "constraintType" VARCHAR(30) NOT NULL,
                    -- required_field, unique_field, range_check, 
                    -- cross_field, cross_entity, temporal, conditional
    
    -- Rule
    "rule"          JSONB NOT NULL,
    -- Examples:
    -- required_field:  {"field": "batch_number"}
    -- range_check:     {"field": "yield_percentage", "min": 95, "max": 105}
    -- cross_field:     {"condition": "expiry_date > manufacturing_date"}
    -- cross_entity:    {"condition": "equipment.qualification_status = 'qualified'",
    --                   "message": "Cannot use unqualified equipment"}
    -- temporal:        {"condition": "calibration_due_date > NOW()",
    --                   "message": "Equipment calibration expired"}
    -- conditional:     {"if": "severity = 'critical'", 
    --                   "then": "batch.status = 'on_hold'"}
    
    "severity"      VARCHAR(20) DEFAULT 'error',
                    -- error (blocks), warning (allows with note), info
    "errorMessage"  VARCHAR(500) NOT NULL,
    
    "isSystem"      BOOLEAN DEFAULT false,
    "isActive"      BOOLEAN DEFAULT true,
    "createdAt"     TIMESTAMP DEFAULT NOW(),
    
    UNIQUE("orgId", "entityId", "code")
);
```

### Default Constraints (Seeded)

```
BATCH CONSTRAINTS
─────────────────────────────────────────────────────────────────
Code                    Type            Rule                            Severity
─────────────────────────────────────────────────────────────────
batch_expiry_after_mfg  cross_field     expiry_date > manufacturing_date error
batch_yield_range       range_check     yield_pct BETWEEN 95-105       warning
batch_mbr_approved      cross_entity    mbr.status = 'approved'        error
batch_equip_qualified   cross_entity    all equipment.status=qualified error
batch_equip_calibrated  temporal        all equipment.cal_due > NOW()  error
batch_critical_hold     conditional     IF deviation.severity=critical  auto
                                        THEN batch.status='on_hold'

EQUIPMENT CONSTRAINTS
─────────────────────────────────────────────────────────────────
equip_cal_not_expired   temporal        calibration_due > NOW()        warning
equip_qualified_use     conditional     IF used_in_batch               error
                                        THEN status=qualified

MBR CONSTRAINTS
─────────────────────────────────────────────────────────────────
mbr_product_required    required_field  product cannot be null         error
mbr_min_one_step        cross_entity    steps.count >= 1               error
mbr_yield_range_valid   cross_field     yield_max > yield_min          error

DEVIATION CONSTRAINTS
─────────────────────────────────────────────────────────────────
dev_capa_before_close   conditional     IF status→closed               error
                                        THEN capa_status != null
dev_root_cause_reqd     conditional     IF status→closed               error
                                        THEN root_cause != null
```

---

## Section 7: Computed Fields & Formulas (New)

```
BATCH COMPUTED FIELDS
─────────────────────────────────────────────────────────────────
Field               Formula                           Dependencies
─────────────────────────────────────────────────────────────────
yield_percentage    (actual_yield / mbr.theoretical    actual_yield,
                    _yield) × 100                      mbr
yield_status        yield_pct >= mbr.yield_min         yield_percentage,
                    && yield_pct <= mbr.yield_max      mbr
                    ? "PASS" : "FAIL"
deviation_count     COUNT(deviations)                  deviations
completion_pct      (completed_steps / total_steps)    batch_steps
                    × 100
duration_hours      (completed_at - started_at)        completed_at,
                    / 3600000                           started_at

MBR COMPUTED FIELDS
─────────────────────────────────────────────────────────────────
total_material_weight SUM(mbr_materials.required_qty   mbr_materials
                      WHERE unit='kg')
step_count          COUNT(steps)                       steps
parameter_count     COUNT(steps.parameters)            steps

PRODUCT COMPUTED FIELDS
─────────────────────────────────────────────────────────────────
active_mbr_count    COUNT(mbrs WHERE status=approved)  mbrs
total_batches       COUNT(batches via mbr)              mbrs
```

---

## The Complete Ontology UI Design

### Navigation Structure

```
/ontology
├── /entities                    ← Entity registry with groups
│   └── /entities/[id]          ← Entity detail (attrs + lifecycle + constraints)
├── /attributes                  ← Cross-entity attribute browser
├── /relationships              ← Relationship graph + table + matrix
├── /lifecycles                  ← State machine editor (NEW)
├── /process-graphs             ← Visual flow editor
│   └── /process-graphs/[id]   ← Graph editor (React Flow)
├── /constraints                 ← Business rule manager (NEW)
└── /overview                    ← Dashboard connecting everything
```

### Overview Page (`/ontology`) — The Hub

```
┌─────────────────────────────────────────────────────────────────────┐
│  ONTOLOGY                                                            │
│  Your domain model — what exists, how it's described, how it flows   │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  DOMAIN MAP (mini relationship graph)                        │   │
│  │                                                              │   │
│  │     Product ──► MBR ──► Batch ──► Review ──► Release        │   │
│  │                  │        │                                   │   │
│  │              Material  Deviation ──► CAPA                    │   │
│  │              Equipment   IPC                                 │   │
│  │                                                              │   │
│  │  15 entities  ·  125 attributes  ·  25 relationships        │   │
│  │  5 lifecycles ·  3 process graphs ·  18 constraints         │   │
│  │                                                              │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐  │
│  │  Entities   │ │ Attributes  │ │Relationships│ │ Lifecycles  │  │
│  │             │ │             │ │             │ │             │  │
│  │  15 defined │ │ 125 fields  │ │ 25 links    │ │ 5 machines  │  │
│  │  4 groups   │ │ 8 types     │ │ 3 views     │ │ 28 states   │  │
│  │             │ │             │ │             │ │             │  │
│  │  → Manage   │ │  → Browse   │ │  → Explore  │ │  → Edit     │  │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘  │
│                                                                      │
│  ┌─────────────┐ ┌─────────────┐ ┌──────────────────────────────┐  │
│  │Process      │ │Constraints  │ │  App Connection Status       │  │
│  │Graphs       │ │             │ │                              │  │
│  │  3 workflows│ │ 18 rules    │ │  eBMR reads from:           │  │
│  │  42 nodes   │ │ 12 active   │ │  ✓ Entities (form gen)     │  │
│  │             │ │             │ │  ✓ Lifecycles (status)     │  │
│  │  → Design   │ │  → Review   │ │  ○ Constraints (planned)   │  │
│  └─────────────┘ └─────────────┘ │  ○ Process graphs (planned)│  │
│                                   └──────────────────────────────┘  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Entities Page (`/ontology/entities`)

```
┌─────────────────────────────────────────────────────────────────────┐
│  ENTITIES                                                   + Add   │
│                                                                      │
│  Filter: [All Groups ▼]  Search: [________________]                 │
│                                                                      │
│  MASTER DATA                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │                                                                 ││
│  │  ┌───────────────────┐  ┌───────────────────┐                  ││
│  │  │  📦 Product       │  │  🧪 Raw Material  │                  ││
│  │  │                   │  │                   │                  ││
│  │  │  16 attributes    │  │  18 attributes    │                  ││
│  │  │  1 lifecycle      │  │  1 lifecycle      │                  ││
│  │  │  3 relationships  │  │  4 relationships  │                  ││
│  │  │  2 constraints    │  │  3 constraints    │                  ││
│  │  │                   │  │                   │                  ││
│  │  │  Prisma: Product  │  │  Prisma: Material │                  ││
│  │  │  Route: /products │  │  Route: /materials│                  ││
│  │  │                   │  │                   │                  ││
│  │  │  🔒 System        │  │  🔒 System        │                  ││
│  │  └───────────────────┘  └───────────────────┘                  ││
│  │                                                                 ││
│  │  ┌───────────────────┐  ┌───────────────────┐                  ││
│  │  │  ⚙️ Equipment     │  │  🏢 Area / Room   │                  ││
│  │  │                   │  │                   │                  ││
│  │  │  17 attributes    │  │  10 attributes    │                  ││
│  │  │  1 lifecycle      │  │  —                │                  ││
│  │  │  3 relationships  │  │  2 relationships  │                  ││
│  │  │  3 constraints    │  │  0 constraints    │                  ││
│  │  │                   │  │                   │                  ││
│  │  │  🔒 System        │  │  🔒 System        │                  ││
│  │  └───────────────────┘  └───────────────────┘                  ││
│  │                                                                 ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
│  OPERATIONS                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │  ┌───────────────────┐  ┌───────────────────┐  ┌─────────────┐││
│  │  │  📋 MBR           │  │  🏭 Batch         │  │ 📝 Batch    │││
│  │  │                   │  │                   │  │    Step      │││
│  │  │  15 attributes    │  │  18 attributes    │  │             │││
│  │  │  1 lifecycle      │  │  1 lifecycle      │  │ 8 attrs     │││
│  │  │  versioned ✓      │  │  5 computed       │  │ 1 lifecycle │││
│  │  │                   │  │                   │  │             │││
│  │  │  🔒 System        │  │  🔒 System        │  │ 🔒 System   │││
│  │  └───────────────────┘  └───────────────────┘  └─────────────┘││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
│  QUALITY                                                             │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │  ┌───────────────────┐  ┌───────────────────┐  ┌─────────────┐││
│  │  │  ⚠️ Deviation     │  │  🔬 IPC Result    │  │ ✅ Batch    │││
│  │  │                   │  │                   │  │    Review   │││
│  │  │  16 attributes    │  │  8 attributes     │  │             │││
│  │  │  1 lifecycle      │  │  —                │  │ 6 attrs     │││
│  │  │                   │  │                   │  │ 1 lifecycle │││
│  │  │  🔒 System        │  │  🔒 System        │  │ 🔒 System   │││
│  │  └───────────────────┘  └───────────────────┘  └─────────────┘││
│  │                                                                 ││
│  │  ┌───────────────────┐                                         ││
│  │  │  🛡️ CAPA          │                                         ││
│  │  │                   │                                         ││
│  │  │  12 attributes    │                                         ││
│  │  │  1 lifecycle      │                                         ││
│  │  │                   │                                         ││
│  │  │  🔒 System        │                                         ││
│  │  └───────────────────┘                                         ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Entity Detail Page (`/ontology/entities/[id]`)

```
┌─────────────────────────────────────────────────────────────────────┐
│  ← Back to Entities                                                  │
│                                                                      │
│  🏭 Batch                                           🔒 System Entity│
│  A single manufacturing run of a product                             │
│                                                                      │
│  Group: Operations  │  Prisma: Batch  │  Route: /batches            │
│  Auditable: ✓  │  Soft Delete: ✓  │  Versioned: ✗  │  Approval: ✗ │
│                                                                      │
│  TABS: [Attributes] [Lifecycle] [Relationships] [Constraints]        │
│         [Computed]                                                    │
│                                                                      │
│  ═══════════════════════════════════════════════════════════════     │
│  ATTRIBUTES                                           + Add Custom  │
│  ═══════════════════════════════════════════════════════════════     │
│                                                                      │
│  ┌─── Identification ──────────────────────────────────────────┐    │
│  │                                                              │    │
│  │  batch_number    text       ✓ required  ✓ unique   🔒       │    │
│  │  mbr             reference  ✓ required  → MBR      🔒       │    │
│  │  product_name    computed   —           via mbr     🔒       │    │
│  │                                                              │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ┌─── Schedule ────────────────────────────────────────────────┐    │
│  │                                                              │    │
│  │  manufacturing_date  date      ✓ required            🔒     │    │
│  │  expiry_date         date      ✓ required  computed  🔒     │    │
│  │  planned_start       datetime  ✗                     🔒     │    │
│  │  planned_end         datetime  ✗                     🔒     │    │
│  │                                                              │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ┌─── Execution ──────────────────────────────────────────────┐     │
│  │                                                              │    │
│  │  status          select     ✓ required  lifecycle    🔒     │    │
│  │    └─ planned, in_progress, on_hold, under_review,          │    │
│  │       approved, rejected, cancelled                          │    │
│  │  current_step    number     ✗                        🔒     │    │
│  │  initiated_by    reference  ✓ required  → User      🔒     │    │
│  │  started_at      datetime   ✗                        🔒     │    │
│  │  completed_at    datetime   ✗                        🔒     │    │
│  │                                                              │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ┌─── Yield ──────────────────────────────────────────────────┐     │
│  │                                                              │    │
│  │  actual_yield        number    ✗           unit: varies 🔒  │    │
│  │  actual_yield_unit   select    ✗                        🔒  │    │
│  │  yield_percentage    computed  ✗  ⚠ critical           🔒  │    │
│  │    └─ formula: (actual_yield / mbr.theoretical_yield) × 100 │    │
│  │  yield_status        computed  ✗                        🔒  │    │
│  │    └─ formula: yield_pct IN [yield_min..yield_max] → PASS   │    │
│  │                                                              │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ┌─── Custom Fields ──────────────────────────────────────────┐     │
│  │                                                              │    │
│  │  room_temperature    number    ✗    unit: °C          ✏️ 🗑 │    │
│  │  humidity            number    ✗    unit: % RH        ✏️ 🗑 │    │
│  │  batch_remarks       textarea  ✗                      ✏️ 🗑 │    │
│  │                                                              │    │
│  │  [+ Add Custom Attribute]                                    │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ═══════════════════════════════════════════════════════════════     │
│  LIFECYCLE                                                           │
│  ═══════════════════════════════════════════════════════════════     │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                                                              │   │
│  │  ● planned ──start──► ● in_progress ──submit──► ● review   │   │
│  │                           │                        │  │      │   │
│  │                      hold │                 reject │  │approve│   │
│  │                           ▼                        │  ▼      │   │
│  │                       ● on_hold               ● rejected     │   │
│  │                           │                   ● approved     │   │
│  │                      resume│                                 │   │
│  │                           ▼                                  │   │
│  │                       ● in_progress                          │   │
│  │                                                              │   │
│  │  7 states · 7 transitions                                   │   │
│  │  3 transitions require e-signature                           │   │
│  │  2 transitions require comment                               │   │
│  │                                                              │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ═══════════════════════════════════════════════════════════════     │
│  RELATIONSHIPS (connected entities)                                  │
│  ═══════════════════════════════════════════════════════════════     │
│                                                                      │
│  ┌────────────┬─────────────────────────┬─────────────┬──────────┐  │
│  │ Direction  │ Relationship            │ Target      │Cardinality│  │
│  ├────────────┼─────────────────────────┼─────────────┼──────────┤  │
│  │ ← inbound │ MBR has batches         │ MBR         │ N:1      │  │
│  │ ← inbound │ User initiates          │ User        │ N:1      │  │
│  │ → outbound│ has step executions     │ Batch Step  │ 1:N      │  │
│  │ → outbound│ has deviations          │ Deviation   │ 1:N      │  │
│  │ → outbound│ has reviews             │ Batch Review│ 1:N      │  │
│  │ ↔ both    │ uses materials          │ Material    │ N:N      │  │
│  │ ↔ both    │ uses equipment          │ Equipment   │ N:N      │  │
│  │ → outbound│ manufactured in         │ Area        │ N:1      │  │
│  └────────────┴─────────────────────────┴─────────────┴──────────┘  │
│                                                                      │
│  ═══════════════════════════════════════════════════════════════     │
│  CONSTRAINTS                                                         │
│  ═══════════════════════════════════════════════════════════════     │
│                                                                      │
│  ┌────────────────────────┬────────────┬─────────────┬──────────┐   │
│  │ Rule                   │ Type       │ Severity    │ Active   │   │
│  ├────────────────────────┼────────────┼─────────────┼──────────┤   │
│  │ Expiry after mfg date  │ cross_field│ ● Error     │ ✓        │   │
│  │ Yield within range     │ range      │ ● Warning   │ ✓        │   │
│  │ MBR must be approved   │ cross_entity│ ● Error    │ ✓        │   │
│  │ Equipment qualified    │ cross_entity│ ● Error    │ ✓        │   │
│  │ Equipment calibrated   │ temporal   │ ● Error     │ ✓        │   │
│  │ Critical dev → hold    │ conditional│ ● Auto      │ ✓        │   │
│  └────────────────────────┴────────────┴─────────────┴──────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## How Everything Connects

### The Connection Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  ONTOLOGY (Configuration Layer)                                      │
│  ════════════════════════════════                                    │
│                                                                      │
│  Entities ──defines──► What forms to show in eBMR                   │
│     │                                                                │
│     ├── Attributes ──defines──► What fields appear on each form     │
│     │      │                                                         │
│     │      └── Computed ──defines──► Auto-calculated values         │
│     │                                                                │
│     ├── Lifecycle ──defines──► What status transitions are allowed   │
│     │      │                                                         │
│     │      └── Transitions ──defines──► Who can change status       │
│     │             │                                                  │
│     │             └── Guards ──defines──► E-sig, comments, roles    │
│     │                                                                │
│     ├── Constraints ──defines──► What validations run on save       │
│     │                                                                │
│     └── Relationships ──defines──► What linked data to show         │
│                                                                      │
│  Process Graphs ──defines──► The sequence of work in a batch        │
│     │                                                                │
│     ├── Nodes ──maps to──► Batch steps + lifecycle transitions      │
│     │                                                                │
│     └── Edges ──defines──► What happens next (including branches)   │
│                                                                      │
│  ═══════════════════════════════════════════════════════════════     │
│                          │                                           │
│                          ▼                                           │
│                                                                      │
│  eBMR APP (Operational Layer)                                        │
│  ════════════════════════════                                        │
│                                                                      │
│  /products     → form generated from Product entity attributes      │
│  /materials    → form generated from Material entity attributes     │
│  /equipment    → form generated from Equipment entity attributes    │
│  /mbr          → steps from process graph, params from ontology     │
│  /batches      → execution follows process graph nodes              │
│  /batches/[id] → status transitions from batch lifecycle            │
│  /review       → review transitions from batch review lifecycle     │
│  /deviations   → form + lifecycle from deviation entity             │
│  /audit-trail  → logged actions from entity.isAuditable flag        │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Seed Function (What Runs on New Org)

```typescript
async function seedSystemOntology(orgId: string) {
  
  // ═══════════════════════════════════════════
  // 1. CREATE 15 ENTITIES (5 groups)
  // ═══════════════════════════════════════════
  
  const entities = await createEntities(orgId, [
    // Master Data
    { code: 'product', label: 'Product', pluralLabel: 'Products',
      group: 'master_data', icon: 'Package', color: '#3B82F6',
      prismaModel: 'Product', appRoute: '/products',
      hasLifecycle: true, isAuditable: true, isSoftDelete: true },
    
    { code: 'raw_material', label: 'Raw Material', pluralLabel: 'Raw Materials',
      group: 'master_data', icon: 'Flask', color: '#10B981',
      prismaModel: 'Material', appRoute: '/materials',
      hasLifecycle: true, isAuditable: true, isSoftDelete: true },
    
    { code: 'equipment', label: 'Equipment', pluralLabel: 'Equipment',
      group: 'master_data', icon: 'Cog', color: '#6366F1',
      prismaModel: 'Equipment', appRoute: '/equipment',
      hasLifecycle: true, isAuditable: true, isSoftDelete: true },
    
    { code: 'area', label: 'Area / Room', pluralLabel: 'Areas',
      group: 'master_data', icon: 'Building', color: '#8B5CF6',
      hasLifecycle: false, isAuditable: true, isSoftDelete: true },
    
    // Operations
    { code: 'mbr', label: 'Master Batch Record', pluralLabel: 'MBRs',
      group: 'operations', icon: 'FileText', color: '#F59E0B',
      prismaModel: 'MasterBatchRecord', appRoute: '/mbr',
      hasLifecycle: true, isAuditable: true, isSoftDelete: true,
      isVersioned: true, requiresApproval: true },
    
    { code: 'batch', label: 'Batch', pluralLabel: 'Batches',
      group: 'operations', icon: 'Factory', color: '#EF4444',
      prismaModel: 'Batch', appRoute: '/batches',
      hasLifecycle: true, isAuditable: true, isSoftDelete: true },
    
    { code: 'batch_step', label: 'Batch Step', pluralLabel: 'Batch Steps',
      group: 'operations', icon: 'ListChecks', color: '#EC4899',
      prismaModel: 'BatchStepExecution',
      hasLifecycle: true, isAuditable: true,
      parentEntityId: 'batch' },
    
    // Quality
    { code: 'deviation', label: 'Deviation', pluralLabel: 'Deviations',
      group: 'quality', icon: 'AlertTriangle', color: '#F97316',
      prismaModel: 'Deviation', appRoute: '/deviations',
      hasLifecycle: true, isAuditable: true, isSoftDelete: true },
    
    { code: 'ipc_result', label: 'IPC Result', pluralLabel: 'IPC Results',
      group: 'quality', icon: 'Microscope', color: '#14B8A6',
      hasLifecycle: false, isAuditable: true,
      parentEntityId: 'batch_step' },
    
    { code: 'batch_review', label: 'Batch Review', pluralLabel: 'Reviews',
      group: 'quality', icon: 'CheckCircle', color: '#22C55E',
      prismaModel: 'BatchReview', appRoute: '/review',
      hasLifecycle: true, isAuditable: true },
    
    { code: 'capa', label: 'CAPA', pluralLabel: 'CAPAs',
      group: 'quality', icon: 'Shield', color: '#0EA5E9',
      hasLifecycle: true, isAuditable: true, isSoftDelete: true },
    
    // People
    { code: 'user', label: 'User', pluralLabel: 'Users',
      group: 'people', icon: 'User', color: '#64748B',
      prismaModel: 'User', appRoute: '/admin/team',
      isAuditable: true },
    
    { code: 'department', label: 'Department', pluralLabel: 'Departments',
      group: 'people', icon: 'Users', color: '#94A3B8' },
    
    // Documents
    { code: 'sop', label: 'SOP', pluralLabel: 'SOPs',
      group: 'documents', icon: 'FileCheck', color: '#A855F7',
      hasLifecycle: true, isVersioned: true, requiresApproval: true },
    
    { code: 'specification', label: 'Specification', pluralLabel: 'Specifications',
      group: 'documents', icon: 'ClipboardList', color: '#D946EF',
      hasLifecycle: true, isVersioned: true, requiresApproval: true },
  ]);

  // ═══════════════════════════════════════════
  // 2. CREATE 125+ ATTRIBUTES
  // ═══════════════════════════════════════════
  
  // Product: 16 attributes (shown above)
  await createAttributes(orgId, entities.product.id, [
    { code: 'product_name', label: 'Product Name', dataType: 'text',
      section: 'General Information', isRequired: true, isSearchable: true,
      isShownInList: true, prismaField: 'productName', isSystem: true },
    { code: 'generic_name', label: 'Generic / INN Name', dataType: 'text',
      section: 'General Information', isRequired: true, prismaField: 'genericName',
      isSystem: true },
    // ... all 16 product attributes
  ]);
  
  // Raw Material: 18 attributes
  // Equipment: 17 attributes
  // Area: 10 attributes
  // MBR: 15 attributes
  // Batch: 18 attributes (including 5 computed)
  // Batch Step: 8 attributes
  // Deviation: 16 attributes
  // IPC Result: 8 attributes
  // Batch Review: 6 attributes
  // CAPA: 12 attributes
  // User: (mapped to existing)
  // Department: 4 attributes
  // SOP: 8 attributes
  // Specification: 10 attributes

  // ═══════════════════════════════════════════
  // 3. CREATE 25 RELATIONSHIPS
  // ═══════════════════════════════════════════
  
  await createRelationships(orgId, [
    { code: 'product_has_mbr',
      sourceEntityId: entities.product.id,
      targetEntityId: entities.mbr.id,
      forwardLabel: 'has Master Batch Records',
      reverseLabel: 'is recipe for',
      cardinality: 'one_to_many',
      prismaRelation: 'mbrs',
      isSystem: true },
    // ... all 25 relationships
  ]);

  // ═══════════════════════════════════════════
  // 4. CREATE 5 LIFECYCLES
  // ═══════════════════════════════════════════
  
  // Batch lifecycle: 7 states, 7 transitions
  const batchLifecycle = await createLifecycle(orgId, entities.batch.id, {
    name: 'Batch Manufacturing Lifecycle',
    states: [
      { code: 'planned', label: 'Planned', color: '#6B7280', isInitial: true },
      { code: 'in_progress', label: 'In Progress', color: '#3B82F6' },
      { code: 'on_hold', label: 'On Hold', color: '#F59E0B' },
      { code: 'under_review', label: 'Under Review', color: '#8B5CF6' },
      { code: 'approved', label: 'Approved', color: '#22C55E', isTerminal: true },
      { code: 'rejected', label: 'Rejected', color: '#EF4444', isTerminal: true },
      { code: 'cancelled', label: 'Cancelled', color: '#6B7280', isTerminal: true },
    ],
    transitions: [
      { from: 'planned', to: 'in_progress', action: 'start',
        label: 'Start Batch', requiredRole: ['admin','production_head','supervisor'],
        requiresSignature: false },
      { from: 'in_progress', to: 'on_hold', action: 'hold',
        label: 'Hold Batch', requiredRole: ['admin','qa_head','qa_reviewer'],
        requiresSignature: true, requiresComment: true },
      { from: 'on_hold', to: 'in_progress', action: 'resume',
        label: 'Resume Batch', requiredRole: ['admin','qa_head'],
        requiresSignature: true, requiresComment: true },
      { from: 'in_progress', to: 'under_review', action: 'submit',
        label: 'Submit for Review', requiredRole: ['admin','production_head','supervisor'],
        requiresSignature: true },
      { from: 'under_review', to: 'approved', action: 'approve',
        label: 'Approve Batch', requiredRole: ['admin','qa_head'],
        requiresSignature: true, requiresComment: false },
      { from: 'under_review', to: 'rejected', action: 'reject',
        label: 'Reject Batch', requiredRole: ['admin','qa_head','qa_reviewer'],
        requiresSignature: true, requiresComment: true },
      { from: 'under_review', to: 'in_progress', action: 'return',
        label: 'Return for Correction', requiredRole: ['admin','qa_head','qa_reviewer'],
        requiresSignature: true, requiresComment: true },
    ],
  });
  
  // MBR lifecycle: 5 states, 4 transitions
  // Deviation lifecycle: 4 states, 3 transitions  
  // Equipment lifecycle: 4 states, 4 transitions
  // CAPA lifecycle: 5 states, 4 transitions

  // ═══════════════════════════════════════════
  // 5. CREATE 18 CONSTRAINTS
  // ═══════════════════════════════════════════
  
  await createConstraints(orgId, [
    { entityId: entities.batch.id, code: 'batch_expiry_after_mfg',
      name: 'Expiry date must be after manufacturing date',
      constraintType: 'cross_field',
      rule: { condition: 'expiry_date > manufacturing_date' },
      severity: 'error', isSystem: true },
    // ... all 18 constraints
  ]);

  // ═══════════════════════════════════════════
  // 6. CREATE 3 PROCESS GRAPHS
  // ═══════════════════════════════════════════
  
  // Manufacturing Workflow (shown above): 15 nodes, 16 edges
  // Quality Review Workflow: 6 nodes, 7 edges
  // Deviation Investigation Workflow: 5 nodes, 5 edges

  // ═══════════════════════════════════════════
  // 7. CREATE LOOKUP CATEGORIES (24 defaults)
  // ═══════════════════════════════════════════
  
  // material_type: 4 values
  // equipment_type: 8 values
  // deviation_category: 7 values
  // area_class: 5 values
}
```

---

## Summary: What Was Missing vs What You Now Have

```
BEFORE (Your Current Ontology)              AFTER (Complete Redesign)
─────────────────────────────               ─────────────────────────────
7 entities, flat                            15 entities, grouped, hierarchical
28 attributes, generic                      125+ attributes, real pharma fields
6 relationships, basic                      25 relationships, full domain graph
1 process graph, linear                     3 process graphs, branching + swim lanes
No lifecycles                               5 state machines with guards
No constraints                              18 business rules with severity
No computed fields                          12 auto-calculated values
No sections/grouping in forms               Attributes grouped into form sections
No entity grouping                          5 groups (master, ops, quality, people, docs)
No bridge entities                          3 many-to-many with bridge attributes
No hierarchy                                Parent-child entities (area, steps)
Descriptive only                            Foundation for prescriptive
No validation rules                         Range, cross-field, temporal, conditional
No connection to eBMR app                   prismaModel + appRoute mapping
```

This ontology is now **world-class** — it models the complete pharmaceutical manufacturing domain with the depth, structure, and interconnection that a real pharma company would recognize and trust. Every entity has real fields, every relationship has meaning, every lifecycle enforces GMP rules, and the process graphs show how work actually flows on a manufacturing floor.