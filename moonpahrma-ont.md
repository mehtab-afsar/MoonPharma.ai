MoonPharma — Complete Platform Architecture
The Big Picture
text

What you're building is NOT just an eBMR app.
You're building a PLATFORM that:

1. Acquires customers (Landing Page)
2. Onboards them (Sign Up → Org Setup → Team → Config)
3. Lets them configure their domain (Ontology Engine)
4. Runs their manufacturing (eBMR App)
5. Manages their subscription (Billing)

Think of it as:

┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  MOONPHARMA PLATFORM                                           │
│                                                                 │
│  ┌──────────┐   ┌──────────────┐   ┌────────────────────────┐  │
│  │          │   │              │   │                        │  │
│  │ Landing  │ → │  Onboarding  │ → │   Admin Dashboard      │  │
│  │ Page     │   │  Flow        │   │                        │  │
│  │          │   │              │   │  ┌──────────────────┐  │  │
│  └──────────┘   └──────────────┘   │  │ Team Management  │  │  │
│                                     │  │ Role Management  │  │  │
│                                     │  │ Subscription     │  │  │
│                                     │  │ Configuration    │  │  │
│                                     │  │ Ontology Engine  │  │  │
│                                     │  └──────────────────┘  │  │
│                                     │                        │  │
│                                     │  ┌──────────────────┐  │  │
│                                     │  │                  │  │  │
│                                     │  │   eBMR APP       │  │  │
│                                     │  │   (Your MVP)     │  │  │
│                                     │  │                  │  │  │
│                                     │  └──────────────────┘  │  │
│                                     │                        │  │
│                                     └────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
PART 1 — THE ONTOLOGY (Domain Model)
What is the Ontology?
text

An ontology defines:
  - CLASSES (What things exist?)
  - PROPERTIES (What attributes do they have?)
  - RELATIONSHIPS (How are they connected?)
  - CONSTRAINTS (What rules govern them?)
  - PROCESS GRAPH (What sequence must they follow?)

For MoonPharma, the ontology is the CONFIGURABLE BACKBONE 
that every pharma company customizes to match their operations.

Company A makes tablets → their steps are different
Company B makes injectables → their IPC checks are different
Company C makes creams → their equipment is different

But the STRUCTURE (ontology) is the same:
  Products have Materials
  Materials go through Steps
  Steps have Parameters
  Parameters have Specifications
  Deviations link to Steps
  QA Reviews link to Batches

The ontology lets you define this structure ONCE
and let each company CONFIGURE the specifics.
Complete eBMR Ontology — Classes & Relationships
text

╔═══════════════════════════════════════════════════════════════════════╗
║                                                                       ║
║  MOONPHARMA eBMR ONTOLOGY                                            ║
║                                                                       ║
║  ═══════════════════════════════════════════════════════════════      ║
║                                                                       ║
║  ORGANIZATION LAYER (Multi-tenant)                                   ║
║  ─────────────────────────────────                                   ║
║                                                                       ║
║  Organization ──┬── has many → Users                                 ║
║                 ├── has many → Roles                                 ║
║                 ├── has many → Teams                                 ║
║                 ├── has one  → Subscription                          ║
║                 ├── has one  → Configuration                         ║
║                 └── has many → [All domain objects below]            ║
║                                                                       ║
║                                                                       ║
║  MASTER DATA LAYER                                                   ║
║  ─────────────────                                                   ║
║                                                                       ║
║  Product ────────┬── has many → ProductVersions                      ║
║                  ├── belongs to → ProductCategory                    ║
║                  ├── has many → MasterBatchRecords                   ║
║                  └── has many → Batches                              ║
║                                                                       ║
║  Material ───────┬── belongs to → MaterialCategory                   ║
║                  │   (API / Excipient / Packaging / Solvent)         ║
║                  ├── has many → MaterialLots                         ║
║                  ├── has many → Suppliers                            ║
║                  ├── has one  → StorageCondition                     ║
║                  └── used in  → BOMItems                            ║
║                                                                       ║
║  MaterialLot ────┬── belongs to → Material                           ║
║                  ├── has one  → Supplier                             ║
║                  ├── has one  → COA (Certificate of Analysis)        ║
║                  ├── has one  → ARNumber                             ║
║                  └── status   → (Quarantine/Released/Rejected/       ║
║                                  Expired)                            ║
║                                                                       ║
║  Equipment ──────┬── belongs to → EquipmentCategory                  ║
║                  │   (Mixer / Dryer / Filler / Press / etc.)         ║
║                  ├── has many → CalibrationRecords                   ║
║                  ├── has many → MaintenanceRecords                   ║
║                  ├── has many → CleaningRecords                      ║
║                  ├── has many → UsageLogs                            ║
║                  └── status   → (Available/InUse/Dirty/              ║
║                                  UnderMaintenance/OutOfService)      ║
║                                                                       ║
║  Area ───────────┬── belongs to → AreaClassification                 ║
║                  │   (Grade A / B / C / D / Unclassified)            ║
║                  ├── has many → EnvironmentalMonitoringLogs          ║
║                  └── has many → AreaLogEntries                       ║
║                                                                       ║
║                                                                       ║
║  MBR LAYER (Template)                                                ║
║  ────────────────────                                                ║
║                                                                       ║
║  MasterBatchRecord ┬── belongs to → Product                          ║
║                    ├── has one  → MBRVersion (current)               ║
║                    ├── has many → MBRVersions (history)              ║
║                    ├── has many → BOMItems                           ║
║                    ├── has many → MBRSteps (ordered)                 ║
║                    ├── has many → ChangeControls                     ║
║                    ├── approved by → User (Production Head)          ║
║                    └── status   → (Draft/UnderReview/Approved/       ║
║                                    Superseded/Retired)               ║
║                                                                       ║
║  MBRVersion ─────┬── belongs to → MasterBatchRecord                  ║
║                  ├── version number (1.0, 1.1, 2.0)                  ║
║                  ├── effective date                                   ║
║                  └── linked to → ChangeControl (if not v1.0)        ║
║                                                                       ║
║  BOMItem ────────┬── belongs to → MasterBatchRecord                  ║
║                  ├── references → Material                           ║
║                  ├── quantity per batch                               ║
║                  ├── unit of measure                                  ║
║                  ├── tolerance (± %)                                  ║
║                  └── sequence order                                   ║
║                                                                       ║
║  MBRStep ────────┬── belongs to → MasterBatchRecord                  ║
║                  ├── step number (sequence)                           ║
║                  ├── step name                                        ║
║                  ├── instructions (rich text)                        ║
║                  ├── step type   → (LineClearance / Dispensing /      ║
║                  │                  Processing / IPC / Packaging)     ║
║                  ├── has many → MBRStepParameters                    ║
║                  ├── has many → MBRStepIPCChecks                     ║
║                  ├── has many → MBRStepEquipment (required)          ║
║                  ├── requires → Roles (who can execute)              ║
║                  ├── requires → Roles (who can verify)               ║
║                  ├── estimated duration                               ║
║                  └── is gate?  → boolean (blocks next step)          ║
║                                                                       ║
║  MBRStepParameter ┬── belongs to → MBRStep                           ║
║                   ├── parameter name                                  ║
║                   ├── parameter type (numeric/text/boolean/           ║
║                   │                   selection)                      ║
║                   ├── unit of measure                                 ║
║                   ├── spec lower limit                                ║
║                   ├── spec upper limit                                ║
║                   ├── target value                                    ║
║                   └── is critical? → boolean                         ║
║                                                                       ║
║  MBRStepIPCCheck ─┬── belongs to → MBRStep                           ║
║                   ├── test name                                       ║
║                   ├── test method (IP/BP/USP/In-house)               ║
║                   ├── frequency                                       ║
║                   ├── sample size                                     ║
║                   ├── spec lower limit                                ║
║                   ├── spec upper limit                                ║
║                   └── result type (Pass-Fail / Numeric / Text)       ║
║                                                                       ║
║                                                                       ║
║  BATCH LAYER (Instance of MBR)                                       ║
║  ──────────────────────────────                                      ║
║                                                                       ║
║  Batch ──────────┬── instantiated from → MasterBatchRecord            ║
║                  │   (snapshot of MBR version at creation time)       ║
║                  ├── belongs to → Product                             ║
║                  ├── batch number (auto-generated)                    ║
║                  ├── batch size                                       ║
║                  ├── manufacturing date                               ║
║                  ├── expiry date                                      ║
║                  ├── has many → BatchDispensingRecords                ║
║                  ├── has many → BatchSteps                            ║
║                  ├── has many → Deviations                           ║
║                  ├── has many → Samples                              ║
║                  ├── has one  → YieldRecord                          ║
║                  ├── has many → QAReviews                            ║
║                  ├── has many → AuditTrailEntries                    ║
║                  ├── has one  → LineClearance                        ║
║                  ├── has many → EnvironmentalLogs                    ║
║                  └── status   → (Draft/Planned/LineClearance/        ║
║                                  Dispensing/InProgress/Completed/     ║
║                                  UnderReview/Approved/Rejected/       ║
║                                  OnHold/Recalled)                    ║
║                                                                       ║
║  LineClearance ──┬── belongs to → Batch                              ║
║                  ├── previous batch reference                         ║
║                  ├── has many → ChecklistItems                       ║
║                  ├── cleared by → User (e-sign)                      ║
║                  ├── verified by → User (e-sign)                     ║
║                  └── status → (Pending/Cleared/Failed)               ║
║                                                                       ║
║  BatchDispensingRecord ┬── belongs to → Batch                        ║
║                        ├── references → BOMItem                      ║
║                        ├── references → MaterialLot                  ║
║                        ├── target quantity                            ║
║                        ├── actual quantity                            ║
║                        ├── tolerance                                  ║
║                        ├── has many → WeighingEntries                ║
║                        │   (container-level: gross, tare, net)       ║
║                        ├── balance/instrument ID                      ║
║                        ├── dispensed by → User (e-sign)              ║
║                        ├── verified by → User (e-sign)               ║
║                        └── status → (Pending/Dispensed/Verified)     ║
║                                                                       ║
║  BatchStep ──────┬── belongs to → Batch                              ║
║                  ├── references → MBRStep (template)                 ║
║                  ├── step number                                      ║
║                  ├── started at (timestamp)                           ║
║                  ├── completed at (timestamp)                         ║
║                  ├── has many → BatchStepParameterValues              ║
║                  ├── has many → BatchStepIPCResults                   ║
║                  ├── has many → BatchStepEquipmentUsed                ║
║                  ├── has many → EnvironmentalReadings                 ║
║                  ├── performed by → User (e-sign)                    ║
║                  ├── verified by → User (e-sign)                     ║
║                  ├── remarks                                          ║
║                  └── status → (Pending/InProgress/Completed/         ║
║                                Skipped/OnHold)                       ║
║                                                                       ║
║  BatchStepParameterValue ┬── belongs to → BatchStep                  ║
║                          ├── references → MBRStepParameter           ║
║                          ├── recorded value                           ║
║                          ├── is within spec? (auto-calculated)       ║
║                          ├── recorded by → User                      ║
║                          ├── recorded at → timestamp                 ║
║                          └── triggered deviation? → Deviation        ║
║                                                                       ║
║  BatchStepIPCResult ─────┬── belongs to → BatchStep                  ║
║                          ├── references → MBRStepIPCCheck            ║
║                          ├── interval number                          ║
║                          ├── has many → SampleValues                 ║
║                          ├── average (auto-calculated)               ║
║                          ├── min / max / RSD (auto-calculated)       ║
║                          ├── result → (Passed/Failed)                ║
║                          ├── tested by → User (e-sign)               ║
║                          └── verified by → User (e-sign)             ║
║                                                                       ║
║                                                                       ║
║  DEVIATION & CAPA LAYER                                              ║
║  ───────────────────────                                             ║
║                                                                       ║
║  Deviation ──────┬── belongs to → Batch                              ║
║                  ├── linked to → BatchStep (optional)                ║
║                  ├── linked to → BatchStepParameterValue (optional)  ║
║                  ├── deviation number (auto-generated)                ║
║                  ├── type → (Planned/Unplanned)                      ║
║                  ├── category → (Process/Equipment/Material/         ║
║                  │               Documentation/Environmental)        ║
║                  ├── severity → (Critical/Major/Minor)               ║
║                  ├── description                                      ║
║                  ├── has one → Investigation                         ║
║                  ├── has one → CAPA                                  ║
║                  ├── has one → ImpactAssessment                      ║
║                  ├── reported by → User                              ║
║                  ├── closed by → User (QA e-sign)                    ║
║                  └── status → (Open/UnderInvestigation/              ║
║                                CAPAInProgress/Closed/Void)           ║
║                                                                       ║
║  Investigation ──┬── belongs to → Deviation                          ║
║                  ├── root cause                                       ║
║                  ├── investigation details                            ║
║                  ├── tools used (5-Why, Fishbone, etc.)              ║
║                  ├── investigated by → User                          ║
║                  └── date completed                                   ║
║                                                                       ║
║  CAPA ───────────┬── belongs to → Deviation                          ║
║                  ├── corrective action                                ║
║                  ├── preventive action                                ║
║                  ├── due date                                         ║
║                  ├── assigned to → User                              ║
║                  ├── effectiveness check required? → boolean         ║
║                  ├── effectiveness check date                         ║
║                  ├── effectiveness verified by → User                ║
║                  └── status → (Open/InProgress/Completed/            ║
║                                EffectivenessVerified)                ║
║                                                                       ║
║                                                                       ║
║  QA REVIEW LAYER                                                     ║
║  ───────────────                                                     ║
║                                                                       ║
║  QAReview ───────┬── belongs to → Batch                              ║
║                  ├── review stage → (1/2/3)                          ║
║                  ├── reviewer → User                                 ║
║                  ├── review checklist items                           ║
║                  ├── AI summary (generated text)                     ║
║                  ├── AI flagged issues (array)                       ║
║                  ├── comments                                         ║
║                  ├── decision → (Approve/Reject/SendBack)            ║
║                  ├── e-signature → ESignature                        ║
║                  └── reviewed at → timestamp                         ║
║                                                                       ║
║                                                                       ║
║  E-SIGNATURE LAYER                                                   ║
║  ─────────────────                                                   ║
║                                                                       ║
║  ESignature ─────┬── signer → User                                   ║
║                  ├── signer role                                      ║
║                  ├── meaning of signature                             ║
║                  │   (Performed/Reviewed/Approved/Verified)           ║
║                  ├── signed at → timestamp                            ║
║                  ├── ip address                                       ║
║                  ├── comments                                         ║
║                  ├── signature hash (SHA-256)                        ║
║                  └── linked to → (BatchStep / Dispensing /           ║
║                                   LineClearance / QAReview /         ║
║                                   Deviation / ChangeControl)        ║
║                                                                       ║
║                                                                       ║
║  CHANGE CONTROL LAYER                                                ║
║  ────────────────────                                                ║
║                                                                       ║
║  ChangeControl ──┬── change number (auto-generated)                  ║
║                  ├── linked to → MasterBatchRecord (optional)        ║
║                  ├── linked to → Configuration (optional)            ║
║                  ├── what changed                                     ║
║                  ├── previous value                                   ║
║                  ├── new value                                        ║
║                  ├── reason for change                                ║
║                  ├── impact assessment                                ║
║                  ├── requested by → User                             ║
║                  ├── reviewed by → User (e-sign)                     ║
║                  ├── approved by → User (e-sign)                     ║
║                  ├── effective date                                   ║
║                  └── status → (Requested/UnderReview/Approved/       ║
║                                Rejected/Implemented)                 ║
║                                                                       ║
║                                                                       ║
║  AUDIT TRAIL LAYER                                                   ║
║  ─────────────────                                                   ║
║                                                                       ║
║  AuditTrailEntry ┬── belongs to → Organization                       ║
║                  ├── user → User                                     ║
║                  ├── action → (Create/Update/Delete/Sign/            ║
║                  │             Login/Logout/Export/View)              ║
║                  ├── entity type (Batch/Step/Material/etc.)          ║
║                  ├── entity id                                        ║
║                  ├── field changed (for updates)                     ║
║                  ├── old value                                        ║
║                  ├── new value                                        ║
║                  ├── reason for change                                ║
║                  ├── ip address                                       ║
║                  ├── user agent                                       ║
║                  ├── session id                                       ║
║                  └── timestamp                                        ║
║                                                                       ║
║                                                                       ║
║  YIELD & RECONCILIATION LAYER                                        ║
║  ────────────────────────────                                        ║
║                                                                       ║
║  YieldRecord ────┬── belongs to → Batch                              ║
║                  ├── theoretical yield                                 ║
║                  ├── actual yield                                      ║
║                  ├── yield percentage (auto-calc)                     ║
║                  ├── acceptable range (min/max %)                    ║
║                  ├── has many → StageWiseYields                      ║
║                  ├── has many → WasteAccounts                        ║
║                  ├── has many → MaterialReconciliations               ║
║                  └── is reconciled? → boolean                        ║
║                                                                       ║
║  StageWiseYield ─┬── belongs to → YieldRecord                        ║
║                  ├── after step → BatchStep                          ║
║                  ├── quantity                                         ║
║                  ├── unit                                             ║
║                  └── percentage of previous stage                    ║
║                                                                       ║
║  MaterialReconciliation ┬── belongs to → YieldRecord                 ║
║                         ├── material → Material                      ║
║                         ├── quantity issued                           ║
║                         ├── quantity used                             ║
║                         ├── quantity wasted                           ║
║                         ├── quantity returned                         ║
║                         └── is reconciled? → boolean                 ║
║                                                                       ║
╚═══════════════════════════════════════════════════════════════════════╝
Process Graph — The State Machine
text

╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║  BATCH PROCESS GRAPH (State Machine)                                ║
║                                                                      ║
║                                                                      ║
║  [START]                                                             ║
║     │                                                                ║
║     ▼                                                                ║
║  ┌──────────┐   Supervisor creates batch from MBR                   ║
║  │  DRAFT   │                                                        ║
║  └────┬─────┘                                                        ║
║       │  Supervisor confirms batch details                           ║
║       ▼                                                              ║
║  ┌──────────┐                                                        ║
║  │ PLANNED  │                                                        ║
║  └────┬─────┘                                                        ║
║       │  Operator initiates line clearance                           ║
║       ▼                                                              ║
║  ┌──────────────┐                                                    ║
║  │    LINE      │  GATE: Cannot proceed until                       ║
║  │  CLEARANCE   │  all checklist items are checked                  ║
║  │              │  and two e-signatures are present                  ║
║  └────┬─────────┘                                                    ║
║       │  Line clearance approved                                     ║
║       ▼                                                              ║
║  ┌──────────────┐                                                    ║
║  │  DISPENSING  │  GATE: Cannot proceed until                       ║
║  │              │  all materials are dispensed AND verified           ║
║  │              │  Material lot tracked                              ║
║  │              │  Expired materials BLOCKED                         ║
║  │              │  Balance calibration VERIFIED                      ║
║  └────┬─────────┘                                                    ║
║       │  All materials verified                                      ║
║       ▼                                                              ║
║  ┌──────────────┐                                                    ║
║  │ IN PROGRESS  │  Sequential step execution                        ║
║  │              │                                                    ║
║  │  Step 1 ──────► GATE steps block next step                       ║
║  │    │              until completed + verified                     ║
║  │  Step 2                                                           ║
║  │    │          ┌──────────────┐                                    ║
║  │  Step N ─────►│  OOS VALUE   │                                   ║
║  │    │          │  DETECTED    │                                    ║
║  │    │          └──────┬───────┘                                    ║
║  │    │                 │                                            ║
║  │    │                 ▼                                            ║
║  │    │          ┌──────────────┐                                    ║
║  │    │          │  DEVIATION   │──► Investigation                   ║
║  │    │          │  CREATED     │──► CAPA                           ║
║  │    │          └──────┬───────┘──► Impact Assessment              ║
║  │    │                 │                                            ║
║  │    │                 ▼                                            ║
║  │    │          Is deviation CRITICAL?                              ║
║  │    │          ┌─────┴──────┐                                     ║
║  │    │         YES          NO                                     ║
║  │    │          │            │                                      ║
║  │    │          ▼            ▼                                      ║
║  │    │    ┌──────────┐  Continue                                   ║
║  │    │    │ ON HOLD  │  execution                                  ║
║  │    │    └────┬─────┘                                              ║
║  │    │         │ QA resolves                                        ║
║  │    │         ▼                                                    ║
║  │    │    Resume or Reject                                          ║
║  │    │                                                              ║
║  │  All steps completed                                              ║
║  │    │                                                              ║
║  └────┤                                                              ║
║       ▼                                                              ║
║  ┌──────────────┐                                                    ║
║  │  COMPLETED   │  Yield entered, reconciliation done               ║
║  │              │  Supervisor sends to QA                            ║
║  └────┬─────────┘                                                    ║
║       │                                                              ║
║       ▼                                                              ║
║  ┌──────────────────────────────────────────────────────┐            ║
║  │                                                      │            ║
║  │  UNDER QA REVIEW                                     │            ║
║  │                                                      │            ║
║  │  Stage 1: QA Reviewer                                │            ║
║  │    │  Reviews all steps, data, deviations            │            ║
║  │    │  Generates AI summary                           │            ║
║  │    │  Signs (e-signature)                            │            ║
║  │    │                                                  │            ║
║  │    ├──► APPROVE → Stage 2                            │            ║
║  │    ├──► REJECT → Batch Rejected                      │            ║
║  │    └──► SEND BACK → Returns to Production            │            ║
║  │                                                      │            ║
║  │  Stage 2: QA Head                                    │            ║
║  │    │  Reviews QA Reviewer's assessment               │            ║
║  │    │  Reviews AI summary                             │            ║
║  │    │  Final decision                                 │            ║
║  │    │                                                  │            ║
║  │    ├──► RELEASE → Batch Approved                     │            ║
║  │    ├──► REJECT → Batch Rejected                      │            ║
║  │    └──► SEND BACK → Returns to QA Reviewer           │            ║
║  │                                                      │            ║
║  └──────────────────────────────────────────────────────┘            ║
║       │                     │                                        ║
║       ▼                     ▼                                        ║
║  ┌──────────┐        ┌──────────┐                                    ║
║  │ APPROVED │        │ REJECTED │                                    ║
║  │ RELEASED │        │          │──► Investigation required          ║
║  └────┬─────┘        └──────────┘                                    ║
║       │                                                              ║
║       │  Post-release issue found                                    ║
║       ▼                                                              ║
║  ┌──────────┐                                                        ║
║  │ RECALLED │  (rare, but must be supported)                        ║
║  └──────────┘                                                        ║
║                                                                      ║
║  [END]                                                               ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝


TRANSITION RULES (who can do what):

  Draft → Planned:           Supervisor
  Planned → Line Clearance:  Operator (initiates)
  Line Clearance → Dispensing: Auto (when clearance signed)
  Dispensing → In Progress:  Auto (when all materials verified)
  In Progress → On Hold:     QA Reviewer or QA Head
  On Hold → In Progress:     QA Head only
  In Progress → Completed:   Supervisor (after all steps done)
  Completed → Under Review:  Auto (when yield entered)
  Under Review → Approved:   QA Head (after all stages signed)
  Under Review → Rejected:   QA Reviewer or QA Head
  Under Review → Completed:  QA Reviewer (send back)
  Approved → Recalled:       QA Head only (with reason)

  BLOCKED TRANSITIONS:
  - Cannot skip Line Clearance
  - Cannot start Dispensing without Line Clearance
  - Cannot start Steps without all Dispensing verified
  - Cannot complete Batch with open CRITICAL deviations
  - Cannot release with unsigned QA stages
  - Operator CANNOT move batch to any review state
  - Admin CANNOT sign batch steps (separation of duties)
PART 2 — PLATFORM ARCHITECTURE
User Journey
text

┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  USER JOURNEY                                                        │
│                                                                      │
│  1. LANDING PAGE                                                     │
│     │  Visitor reads about the product                               │
│     │  Clicks "Get Started Free"                                     │
│     ▼                                                                │
│                                                                      │
│  2. SIGN UP                                                          │
│     │  Email + Password                                              │
│     │  Email verification                                            │
│     ▼                                                                │
│                                                                      │
│  3. ONBOARDING WIZARD (4 steps)                                     │
│     │                                                                │
│     │  Step 1: Organization Setup                                    │
│     │    Company name, license number, address                       │
│     │    Manufacturing type (Tablets/Capsules/Injectables/etc.)      │
│     │                                                                │
│     │  Step 2: Your Profile                                          │
│     │    Full name, employee code, designation                       │
│     │    Auto-assigned as Admin + first user                         │
│     │                                                                │
│     │  Step 3: Invite Team (optional, can skip)                     │
│     │    Enter emails, assign roles                                  │
│     │    Or skip and do later from dashboard                         │
│     │                                                                │
│     │  Step 4: Quick Configuration                                   │
│     │    Batch number format                                         │
│     │    Deviation number format                                     │
│     │    Yield acceptable range                                      │
│     │    Or use defaults                                             │
│     │                                                                │
│     ▼                                                                │
│                                                                      │
│  4. ADMIN DASHBOARD                                                  │
│     │                                                                │
│     │  ┌──────────────────────────────────────────────────┐         │
│     │  │                                                  │         │
│     │  │  SIDEBAR:                                        │         │
│     │  │                                                  │         │
│     │  │  ▸ Overview (KPIs, recent activity)             │         │
│     │  │  ▸ Team Management                               │         │
│     │  │  ▸ Role Management                               │         │
│     │  │  ▸ Configuration                                 │         │
│     │  │  ▸ Subscription & Billing                        │         │
│     │  │  ▸ Audit Trail                                   │         │
│     │  │                                                  │         │
│     │  │  ─────────────────────────                       │         │
│     │  │                                                  │         │
│     │  │  ▸ Enter eBMR App →                             │         │
│     │  │                                                  │         │
│     │  └──────────────────────────────────────────────────┘         │
│     │                                                                │
│     │  Clicking "Enter eBMR App" takes you to the                   │
│     │  manufacturing application (your current MVP)                  │
│     │                                                                │
│     ▼                                                                │
│                                                                      │
│  5. eBMR APP (Your existing MVP)                                    │
│     Products, Materials, Equipment, MBR, Batches,                    │
│     Execution, QA Review, Deviations, Reports, AI                   │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
Application Structure (Routes)
text

ROUTE MAP:
═══════════════════════════════════════════════════════════

PUBLIC ROUTES (no auth):
  /                          Landing page
  /pricing                   Pricing page
  /sign-up                   Registration
  /sign-in                   Login
  /verify-email              Email verification
  /forgot-password           Password reset
  /reset-password            Password reset form

ONBOARDING ROUTES (auth, no org yet):
  /onboarding                Redirect to current step
  /onboarding/organization   Step 1: Org setup
  /onboarding/profile        Step 2: Your profile
  /onboarding/team           Step 3: Invite team
  /onboarding/config         Step 4: Quick config
  /onboarding/complete       Success + enter dashboard

ADMIN DASHBOARD ROUTES (auth + org):
  /admin                     Overview dashboard
  /admin/team                Team member list
  /admin/team/invite         Invite new member
  /admin/team/[id]           Member detail/edit
  /admin/roles               Role management
  /admin/roles/[id]          Role detail/permissions
  /admin/config              Configuration hub
  /admin/config/general      Org settings
  /admin/config/numbering    Numbering formats
  /admin/config/workflow     Process workflow config
  /admin/config/templates    Checklist/form templates
  /admin/config/ontology     Domain model config (advanced)
  /admin/subscription        Plan & billing
  /admin/audit-trail         Platform-level audit trail

eBMR APP ROUTES (auth + org + role-based):
  /app                       eBMR dashboard
  /app/products              Product master
  /app/materials             Material master
  /app/materials/lots        Material lot tracking
  /app/equipment             Equipment master
  /app/equipment/[id]/log    Equipment log
  /app/areas                 Area master
  /app/mbr                   Master batch records
  /app/mbr/[id]              MBR detail
  /app/mbr/[id]/versions     MBR version history
  /app/batches               Batch list
  /app/batches/new           Create batch
  /app/batches/[id]          Batch detail
  /app/batches/[id]/execute  Batch execution
  /app/batches/[id]/yield    Yield reconciliation
  /app/deviations            Deviation list
  /app/deviations/[id]       Deviation detail + CAPA
  /app/change-control        Change control list
  /app/change-control/[id]   Change control detail
  /app/review                QA review queue
  /app/review/[id]           Batch review
  /app/reports               Reports dashboard
  /app/audit-trail           eBMR audit trail
  /app/ai-assistant          AI assistant
PART 3 — TEAM & ROLE MANAGEMENT
Team Management
text

┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  TEAM MANAGEMENT                                         + Invite   │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │                                                                │  │
│  │  Search team members...                          Filter by role│  │
│  │                                                                │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │                                                                │  │
│  │  Name              Email                    Role        Status │  │
│  │  ────────────────────────────────────────────────────────────  │  │
│  │                                                                │  │
│  │  Mehtab Afsar      mehtab@moonpharma.com   Admin       Active │  │
│  │  Dr. Ravi Kumar    ravi.kumar@moonpharma    Prod Head   Active │  │
│  │  Priya Sharma      priya.sharma@moonpha     Supervisor  Active │  │
│  │  Arjun Patel       arjun.patel@moonphar     Operator    Active │  │
│  │  Kavita Nair       kavita.nair@moonphar     QA Reviewer Active │  │
│  │  Suresh Mehta      suresh.mehta@moonpha     QA Head     Active │  │
│  │  ────────────────────────────────────────────────────────────  │  │
│  │  Pending Invitations:                                          │  │
│  │  neha.gupta@moonpharma.com      Operator     Invited 2d ago   │  │
│  │                                                                │  │
│  │                                                 6 active · 1 pending│
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘


INVITE FLOW:

┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  INVITE TEAM MEMBER                                                  │
│                                                                      │
│  Email:           [ neha.gupta@moonpharma.com  ]                    │
│  Full Name:       [ Neha Gupta                  ]                    │
│  Employee Code:   [ EMP007                      ]                    │
│  Department:      [ Production                  ▼]                   │
│                                                                      │
│  Assign Role:                                                        │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │                                                              │    │
│  │  ○ Admin          Full platform access                      │    │
│  │  ○ Production Head  MBR approval, batch oversight           │    │
│  │  ○ Supervisor     Batch initiation, step verification       │    │
│  │  ● Operator       Step execution, data entry                │    │
│  │  ○ QA Reviewer    Batch review, deviation flagging          │    │
│  │  ○ QA Head        Final release, AI summary review          │    │
│  │                                                              │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                      │
│                                                                      │
│  ┌─────────────────────┐                                            │
│  │  Send Invitation    │                                            │
│  └─────────────────────┘                                            │
│                                                                      │
│  The invitee will receive an email with a link to:                  │
│  1. Set their password                                               │
│  2. Set their e-signature PIN                                       │
│  3. Accept the organization invitation                               │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
Role Management (Permissions Matrix)
text

┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  ROLE PERMISSIONS                                                    │
│                                                                      │
│  These are the DEFAULT roles. In future, custom roles                │
│  can be created. For MVP, these 6 are fixed.                        │
│                                                                      │
│                                                                      │
│  PERMISSION MATRIX:                                                  │
│                                                                      │
│  Action                    Admin  ProdH  Supv  Oper  QAR   QAH     │
│  ───────────────────────────────────────────────────────────────     │
│                                                                      │
│  PLATFORM:                                                           │
│  Manage team                 ✓      ·      ·     ·     ·     ·      │
│  Manage roles                ✓      ·      ·     ·     ·     ·      │
│  Manage subscription         ✓      ·      ·     ·     ·     ·      │
│  View platform audit trail   ✓      ·      ·     ·     ·     ·      │
│  Configure org settings      ✓      ·      ·     ·     ·     ·      │
│                                                                      │
│  MASTER DATA:                                                        │
│  Create/edit products        ✓      ✓      ·     ·     ·     ·      │
│  Create/edit materials       ✓      ✓      ✓     ·     ·     ·      │
│  Create/edit equipment       ✓      ✓      ✓     ·     ·     ·      │
│  View master data            ✓      ✓      ✓     ✓     ✓     ✓      │
│                                                                      │
│  MBR:                                                                │
│  Create MBR                  ·      ✓      ✓     ·     ·     ·      │
│  Edit MBR (draft)            ·      ✓      ✓     ·     ·     ·      │
│  Approve MBR                 ·      ✓      ·     ·     ·     ·      │
│  View MBR                    ✓      ✓      ✓     ✓     ✓     ✓      │
│                                                                      │
│  BATCH:                                                              │
│  Create batch                ·      ✓      ✓     ·     ·     ·      │
│  Initiate line clearance     ·      ·      ✓     ✓     ·     ·      │
│  Execute dispensing          ·      ·      ·     ✓     ·     ·      │
│  Verify dispensing           ·      ·      ✓     ·     ·     ·      │
│  Execute steps               ·      ·      ·     ✓     ·     ·      │
│  Verify steps                ·      ✓      ✓     ·     ·     ·      │
│  Complete batch              ·      ·      ✓     ·     ·     ·      │
│  View batch                  ✓      ✓      ✓     ✓     ✓     ✓      │
│  Put batch on hold           ·      ·      ·     ·     ✓     ✓      │
│                                                                      │
│  DEVIATION:                                                          │
│  Create deviation            ·      ✓      ✓     ✓     ✓     ·      │
│  Investigate deviation       ·      ✓      ✓     ·     ✓     ·      │
│  Close deviation             ·      ·      ·     ·     ·     ✓      │
│  View deviations             ✓      ✓      ✓     ✓     ✓     ✓      │
│                                                                      │
│  QA REVIEW:                                                          │
│  Stage 1 review              ·      ·      ·     ·     ✓     ·      │
│  Stage 2 review              ·      ·      ·     ·     ·     ✓      │
│  Generate AI summary         ·      ·      ·     ·     ✓     ✓      │
│  Release batch               ·      ·      ·     ·     ·     ✓      │
│  Reject batch                ·      ·      ·     ·     ✓     ✓      │
│                                                                      │
│  REPORTS:                                                            │
│  View reports                ✓      ✓      ✓     ·     ✓     ✓      │
│  Export PDF                  ✓      ✓      ✓     ·     ✓     ✓      │
│                                                                      │
│  AUDIT TRAIL:                                                        │
│  View eBMR audit trail       ✓      ✓      ·     ·     ✓     ✓      │
│                                                                      │
│  AI ASSISTANT:                                                       │
│  Use AI assistant            ✓      ✓      ✓     ✓     ✓     ✓      │
│                                                                      │
│  CHANGE CONTROL:                                                     │
│  Request change              ·      ✓      ✓     ·     ·     ·      │
│  Review change               ·      ·      ·     ·     ✓     ·      │
│  Approve change              ·      ·      ·     ·     ·     ✓      │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
PART 4 — CONFIGURATION ENGINE
Configuration Hub
text

┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  CONFIGURATION                                                       │
│                                                                      │
│  Customize MoonPharma to match your manufacturing process.          │
│                                                                      │
│                                                                      │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │                  │  │                  │  │                  │  │
│  │  GENERAL         │  │  NUMBERING       │  │  WORKFLOW        │  │
│  │  SETTINGS        │  │  FORMATS         │  │  RULES           │  │
│  │                  │  │                  │  │                  │  │
│  │  Company info    │  │  Batch numbers   │  │  Batch states    │  │
│  │  License info    │  │  Deviation no.   │  │  QA review       │  │
│  │  Logo upload     │  │  Change ctrl no. │  │  stages          │  │
│  │  Time zone       │  │  MBR numbering   │  │  Gate rules      │  │
│  │                  │  │                  │  │  Auto-triggers   │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  │
│                                                                      │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │                  │  │                  │  │                  │  │
│  │  SPECIFICATIONS  │  │  CATEGORIES      │  │  CHECKLISTS      │  │
│  │  & LIMITS        │  │  & LOOKUPS       │  │  & FORMS         │  │
│  │                  │  │                  │  │                  │  │
│  │  Yield range     │  │  Material types  │  │  Line clearance  │  │
│  │  Tolerance       │  │  Equipment types │  │  checklist       │  │
│  │  defaults        │  │  Deviation       │  │  Custom step     │  │
│  │  Environmental   │  │  categories      │  │  checklists      │  │
│  │  limits          │  │  Area classes    │  │  Review forms    │  │
│  │                  │  │                  │  │                  │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
Each Configuration Section in Detail
text

═══════════════════════════════════════════════════════════════

1. GENERAL SETTINGS

  Organization Name:       [ MoonPharma Pvt Ltd          ]
  Manufacturing License:   [ ML/2024/00123               ]
  Drug License Number:     [ DL-MH-2024-00456            ]
  GMP Certificate No:      [ GMP-WHO-2024-789            ]
  Address:                 [ Plot 45, MIDC, Pune 411018  ]
  
  Logo:                    [Upload] (appears on PDF exports)
  Time Zone:               [ Asia/Kolkata (UTC+5:30)  ▼  ]
  Date Format:             [ DD-MM-YYYY               ▼  ]
  
  Default UOM System:      [ Metric (kg, L, mg)       ▼  ]

═══════════════════════════════════════════════════════════════

2. NUMBERING FORMATS

  Batch Number:
    Format:    [ {PREFIX}-{YEAR}-{SEQ:4} ]
    Preview:   BN-2026-0001
    Prefix:    [ BN ]
    Reset:     [ Yearly ▼ ]  (resets sequence each year)
    
  Deviation Number:
    Format:    [ DEV-{YEAR}-{SEQ:4} ]
    Preview:   DEV-2026-0001
    
  Change Control:
    Format:    [ CC-{YEAR}-{SEQ:4} ]
    Preview:   CC-2026-0001
    
  MBR Number:
    Format:    [ MBR-{PRODUCT_CODE}-{STRENGTH} ]
    Preview:   MBR-AMOX-500

═══════════════════════════════════════════════════════════════

3. WORKFLOW RULES

  QA Review Stages:        [ 2 ▼ ]  (2 or 3)
    Stage 1: QA Reviewer
    Stage 2: QA Head
    (Stage 3: Regulatory QA — optional for some companies)

  Batch Execution Mode:
    ○ Strict Sequential (must complete step N before N+1)
    ● Sequential with Parallel IPC (IPC can run alongside)
    ○ Flexible (any order — NOT recommended for GMP)

  Auto-Deviation Trigger:
    ● Enabled (auto-create deviation when OOS detected)
    ○ Disabled (manual deviation creation only)

  Critical Deviation Behavior:
    ● Auto-hold batch (put batch on hold automatically)
    ○ Alert only (notify QA but don't hold)

  Line Clearance Requirement:
    ● Required for every batch (recommended)
    ○ Required only for product changeover

  E-Signature Method:
    ● Username + Password (21 CFR Part 11 compliant)
    ○ PIN only (not recommended for regulated)
    ○ Username + Password + PIN (most secure)

  Session Timeout:         [ 30 ▼ ] minutes
  Password Expiry:         [ 90 ▼ ] days
  Failed Login Lockout:    [ 5  ▼ ] attempts

═══════════════════════════════════════════════════════════════

4. SPECIFICATIONS & LIMITS

  Default Yield Range:
    Minimum:  [ 95  ] %
    Maximum:  [ 100 ] %
    
  Default Material Tolerance:
    Standard: [ ± 0.5 ] %
    API:      [ ± 0.1 ] %
    
  Environmental Limits:
    Temperature:
      Min: [ 20 ] °C    Max: [ 25 ] °C
    Relative Humidity:
      Min: [ 40 ] %     Max: [ 60 ] %
    Differential Pressure:
      Min: [ 10 ] Pa

  (These can be overridden per product/MBR)

═══════════════════════════════════════════════════════════════

5. CATEGORIES & LOOKUPS (Configurable Dropdowns)

  Material Categories:
    ┌────────────────────────────────────────┐
    │ ✓ API                                  │
    │ ✓ Excipient                            │
    │ ✓ Packaging Material                   │
    │ ✓ Solvent                              │
    │   [+ Add Category]                     │
    └────────────────────────────────────────┘

  Equipment Categories:
    ┌────────────────────────────────────────┐
    │ ✓ Mixer                                │
    │ ✓ Granulator                           │
    │ ✓ Dryer                                │
    │ ✓ Sifter                               │
    │ ✓ Blender                              │
    │ ✓ Tablet Press                         │
    │ ✓ Capsule Filler                       │
    │ ✓ Coating Machine                      │
    │   [+ Add Category]                     │
    └────────────────────────────────────────┘

  Deviation Categories:
    ┌────────────────────────────────────────┐
    │ ✓ Process                              │
    │ ✓ Equipment                            │
    │ ✓ Material                             │
    │ ✓ Documentation                        │
    │ ✓ Environmental                        │
    │ ✓ Personnel                            │
    │   [+ Add Category]                     │
    └────────────────────────────────────────┘

  Deviation Severities:
    ┌────────────────────────────────────────┐
    │ ✓ Critical  (auto-holds batch)         │
    │ ✓ Major     (requires QA attention)    │
    │ ✓ Minor     (log and proceed)          │
    └────────────────────────────────────────┘

  Step Types:
    ┌────────────────────────────────────────┐
    │ ✓ Line Clearance                       │
    │ ✓ Dispensing                           │
    │ ✓ Processing                           │
    │ ✓ IPC                                  │
    │ ✓ Packaging                            │
    │ ✓ Labeling                             │
    │   [+ Add Type]                         │
    └────────────────────────────────────────┘

  Area Classifications:
    ┌────────────────────────────────────────┐
    │ ✓ Grade A (ISO 5)                      │
    │ ✓ Grade B (ISO 7)                      │
    │ ✓ Grade C (ISO 8)                      │
    │ ✓ Grade D                              │
    │ ✓ Unclassified                         │
    └────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════

6. CHECKLISTS & TEMPLATES

  Line Clearance Checklist:
    ┌────────────────────────────────────────────────────────┐
    │                                                        │
    │  Default checklist items (admin can add/remove/edit):  │
    │                                                        │
    │  ☑ Previous batch materials removed from area         │
    │  ☑ Previous batch documents removed                   │
    │  ☑ Equipment cleaned and verified clean               │
    │  ☑ No cross-contamination risk                        │
    │  ☑ Room temperature within spec                       │
    │  ☑ Room humidity within spec                          │
    │  ☑ Area status label changed                          │
    │  ☑ Equipment status label changed                     │
    │  ☑ Weighing balance calibrated                        │
    │  ☐ [+ Add checklist item]                             │
    │                                                        │
    │  Requires signatures: Operator + Supervisor            │
    │                                                        │
    └────────────────────────────────────────────────────────┘

  QA Review Checklist:
    ┌────────────────────────────────────────────────────────┐
    │                                                        │
    │  ☑ All manufacturing steps completed and signed       │
    │  ☑ All dispensing records verified                    │
    │  ☑ All IPC checks performed and within spec          │
    │  ☑ All deviations investigated and closed            │
    │  ☑ Yield within acceptable range                     │
    │  ☑ Environmental monitoring data complete            │
    │  ☑ Equipment logs reviewed                           │
    │  ☑ All e-signatures present and valid                │
    │  ☐ [+ Add checklist item]                             │
    │                                                        │
    └────────────────────────────────────────────────────────┘
PART 5 — DATABASE SCHEMA (Migration Files)
This is the SQL you need. Every table.
SQL

-- ═══════════════════════════════════════════════════════════════
-- MOONPHARMA eBMR — COMPLETE DATABASE SCHEMA
-- Migration File: 001_complete_schema.sql
-- ═══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
-- ENUMS
-- ─────────────────────────────────────────────────────────────

CREATE TYPE org_status AS ENUM ('active', 'suspended', 'cancelled');
CREATE TYPE subscription_plan AS ENUM ('free', 'starter', 'professional', 'enterprise');
CREATE TYPE invite_status AS ENUM ('pending', 'accepted', 'expired', 'revoked');

CREATE TYPE user_role AS ENUM (
  'admin', 'production_head', 'supervisor', 
  'operator', 'qa_reviewer', 'qa_head'
);

CREATE TYPE user_status AS ENUM ('active', 'inactive', 'locked');

CREATE TYPE material_category AS ENUM (
  'api', 'excipient', 'packaging', 'solvent', 'other'
);

CREATE TYPE material_lot_status AS ENUM (
  'quarantine', 'released', 'rejected', 'expired'
);

CREATE TYPE equipment_status AS ENUM (
  'available', 'in_use', 'dirty', 'under_maintenance', 
  'out_of_service', 'under_calibration'
);

CREATE TYPE equipment_category AS ENUM (
  'mixer', 'granulator', 'dryer', 'sifter', 'blender',
  'tablet_press', 'capsule_filler', 'coating_machine',
  'packaging_machine', 'weighing_balance', 'other'
);

CREATE TYPE area_classification AS ENUM (
  'grade_a', 'grade_b', 'grade_c', 'grade_d', 'unclassified'
);

CREATE TYPE mbr_status AS ENUM (
  'draft', 'under_review', 'approved', 'superseded', 'retired'
);

CREATE TYPE step_type AS ENUM (
  'line_clearance', 'dispensing', 'processing', 
  'ipc', 'packaging', 'labeling', 'other'
);

CREATE TYPE parameter_type AS ENUM (
  'numeric', 'text', 'boolean', 'selection', 'date', 'time'
);

CREATE TYPE batch_status AS ENUM (
  'draft', 'planned', 'line_clearance', 'dispensing',
  'in_progress', 'completed', 'under_review',
  'qa_reviewer_approved', 'approved', 'rejected',
  'on_hold', 'recalled'
);

CREATE TYPE dispensing_status AS ENUM (
  'pending', 'dispensed', 'verified'
);

CREATE TYPE step_status AS ENUM (
  'pending', 'in_progress', 'completed', 'skipped', 'on_hold'
);

CREATE TYPE line_clearance_status AS ENUM (
  'pending', 'cleared', 'failed'
);

CREATE TYPE deviation_type AS ENUM ('planned', 'unplanned');
CREATE TYPE deviation_category AS ENUM (
  'process', 'equipment', 'material', 
  'documentation', 'environmental', 'personnel'
);
CREATE TYPE deviation_severity AS ENUM ('critical', 'major', 'minor');
CREATE TYPE deviation_status AS ENUM (
  'open', 'under_investigation', 'capa_in_progress', 
  'closed', 'void'
);

CREATE TYPE capa_status AS ENUM (
  'open', 'in_progress', 'completed', 'effectiveness_verified'
);

CREATE TYPE change_control_status AS ENUM (
  'requested', 'under_review', 'approved', 
  'rejected', 'implemented'
);

CREATE TYPE qa_review_decision AS ENUM (
  'approve', 'reject', 'send_back'
);

CREATE TYPE e_signature_meaning AS ENUM (
  'performed', 'reviewed', 'approved', 
  'verified', 'witnessed', 'released', 'rejected'
);

CREATE TYPE audit_action AS ENUM (
  'create', 'update', 'delete', 'sign', 'login', 
  'logout', 'export', 'view', 'status_change',
  'password_change', 'failed_login'
);

CREATE TYPE ipc_result_type AS ENUM ('pass_fail', 'numeric', 'text');
CREATE TYPE numbering_reset AS ENUM ('yearly', 'monthly', 'never');


-- ─────────────────────────────────────────────────────────────
-- ORGANIZATION & USERS
-- ─────────────────────────────────────────────────────────────

CREATE TABLE organizations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              VARCHAR(255) NOT NULL,
  slug              VARCHAR(100) UNIQUE NOT NULL,
  license_number    VARCHAR(100),
  drug_license      VARCHAR(100),
  gmp_certificate   VARCHAR(100),
  address           TEXT,
  city              VARCHAR(100),
  state             VARCHAR(100),
  country           VARCHAR(100) DEFAULT 'India',
  pincode           VARCHAR(10),
  phone             VARCHAR(20),
  email             VARCHAR(255),
  logo_url          VARCHAR(500),
  timezone          VARCHAR(50) DEFAULT 'Asia/Kolkata',
  date_format       VARCHAR(20) DEFAULT 'DD-MM-YYYY',
  status            org_status DEFAULT 'active',
  onboarding_completed BOOLEAN DEFAULT false,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE subscriptions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            UUID NOT NULL REFERENCES organizations(id),
  plan              subscription_plan DEFAULT 'free',
  max_users         INTEGER DEFAULT 5,
  max_batches_month INTEGER DEFAULT 10,
  max_products      INTEGER DEFAULT 5,
  ai_queries_month  INTEGER DEFAULT 50,
  started_at        TIMESTAMPTZ DEFAULT NOW(),
  expires_at        TIMESTAMPTZ,
  is_active         BOOLEAN DEFAULT true,
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE users (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            UUID REFERENCES organizations(id),
  email             VARCHAR(255) UNIQUE NOT NULL,
  password_hash     VARCHAR(255) NOT NULL,
  full_name         VARCHAR(255) NOT NULL,
  employee_code     VARCHAR(50),
  designation       VARCHAR(100),
  department        VARCHAR(100),
  role              user_role NOT NULL DEFAULT 'operator',
  status            user_status DEFAULT 'active',
  phone             VARCHAR(20),
  
  -- E-signature related
  e_signature_pin   VARCHAR(255), -- hashed
  signature_method  VARCHAR(50) DEFAULT 'username_password',
  
  -- Security
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until      TIMESTAMPTZ,
  last_login_at     TIMESTAMPTZ,
  last_login_ip     INET,
  password_changed_at TIMESTAMPTZ DEFAULT NOW(),
  must_change_password BOOLEAN DEFAULT false,
  
  -- Sessions
  current_session_id VARCHAR(255),
  
  email_verified    BOOLEAN DEFAULT false,
  email_verified_at TIMESTAMPTZ,
  
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE invitations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            UUID NOT NULL REFERENCES organizations(id),
  email             VARCHAR(255) NOT NULL,
  full_name         VARCHAR(255),
  employee_code     VARCHAR(50),
  department        VARCHAR(100),
  role              user_role NOT NULL,
  invited_by        UUID NOT NULL REFERENCES users(id),
  status            invite_status DEFAULT 'pending',
  token             VARCHAR(255) UNIQUE NOT NULL,
  expires_at        TIMESTAMPTZ NOT NULL,
  accepted_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);


-- ─────────────────────────────────────────────────────────────
-- CONFIGURATION
-- ─────────────────────────────────────────────────────────────

CREATE TABLE org_configurations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            UUID NOT NULL REFERENCES organizations(id) UNIQUE,
  
  -- Numbering
  batch_number_prefix     VARCHAR(10) DEFAULT 'BN',
  batch_number_format     VARCHAR(100) DEFAULT '{PREFIX}-{YEAR}-{SEQ:4}',
  batch_number_reset      numbering_reset DEFAULT 'yearly',
  batch_number_current_seq INTEGER DEFAULT 0,
  
  deviation_number_prefix VARCHAR(10) DEFAULT 'DEV',
  deviation_number_format VARCHAR(100) DEFAULT '{PREFIX}-{YEAR}-{SEQ:4}',
  deviation_number_current_seq INTEGER DEFAULT 0,
  
  change_control_prefix   VARCHAR(10) DEFAULT 'CC',
  change_control_format   VARCHAR(100) DEFAULT '{PREFIX}-{YEAR}-{SEQ:4}',
  change_control_current_seq INTEGER DEFAULT 0,
  
  -- Workflow
  qa_review_stages        INTEGER DEFAULT 2 CHECK (qa_review_stages IN (2, 3)),
  batch_execution_mode    VARCHAR(50) DEFAULT 'strict_sequential',
  auto_deviation_trigger  BOOLEAN DEFAULT true,
  critical_deviation_auto_hold BOOLEAN DEFAULT true,
  line_clearance_required VARCHAR(50) DEFAULT 'always',
  
  -- E-Signature
  e_signature_method      VARCHAR(50) DEFAULT 'username_password',
  session_timeout_minutes INTEGER DEFAULT 30,
  password_expiry_days    INTEGER DEFAULT 90,
  failed_login_lockout    INTEGER DEFAULT 5,
  
  -- Specifications
  default_yield_min       DECIMAL(5,2) DEFAULT 95.00,
  default_yield_max       DECIMAL(5,2) DEFAULT 100.00,
  default_material_tolerance DECIMAL(5,2) DEFAULT 0.50,
  default_api_tolerance   DECIMAL(5,2) DEFAULT 0.10,
  
  -- Environmental
  env_temp_min            DECIMAL(5,2) DEFAULT 20.00,
  env_temp_max            DECIMAL(5,2) DEFAULT 25.00,
  env_humidity_min        DECIMAL(5,2) DEFAULT 40.00,
  env_humidity_max        DECIMAL(5,2) DEFAULT 60.00,
  env_diff_pressure_min   DECIMAL(5,2) DEFAULT 10.00,
  
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- Configurable lookup values
CREATE TABLE lookup_categories (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            UUID NOT NULL REFERENCES organizations(id),
  category_type     VARCHAR(50) NOT NULL, -- 'material_category', 'equipment_category', etc.
  name              VARCHAR(100) NOT NULL,
  code              VARCHAR(50),
  description       TEXT,
  is_active         BOOLEAN DEFAULT true,
  sort_order        INTEGER DEFAULT 0,
  is_system         BOOLEAN DEFAULT false, -- cannot be deleted
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(org_id, category_type, code)
);

-- Configurable checklists
CREATE TABLE checklist_templates (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            UUID NOT NULL REFERENCES organizations(id),
  template_type     VARCHAR(50) NOT NULL, -- 'line_clearance', 'qa_review', etc.
  name              VARCHAR(255) NOT NULL,
  is_active         BOOLEAN DEFAULT true,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE checklist_template_items (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id       UUID NOT NULL REFERENCES checklist_templates(id) ON DELETE CASCADE,
  item_text         TEXT NOT NULL,
  is_required       BOOLEAN DEFAULT true,
  sort_order        INTEGER DEFAULT 0,
  requires_value    BOOLEAN DEFAULT false, -- some items need a value (e.g., temperature)
  value_type        parameter_type,
  value_spec_min    DECIMAL(10,3),
  value_spec_max    DECIMAL(10,3),
  value_unit        VARCHAR(20),
  created_at        TIMESTAMPTZ DEFAULT NOW()
);


-- ─────────────────────────────────────────────────────────────
-- MASTER DATA
-- ─────────────────────────────────────────────────────────────

CREATE TABLE products (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            UUID NOT NULL REFERENCES organizations(id),
  name              VARCHAR(255) NOT NULL,
  code              VARCHAR(50) NOT NULL,
  strength          VARCHAR(50),
  dosage_form       VARCHAR(100), -- Tablet, Capsule, Injection, etc.
  shelf_life_months INTEGER,
  storage_conditions TEXT,
  description       TEXT,
  is_active         BOOLEAN DEFAULT true,
  created_by        UUID REFERENCES users(id),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(org_id, code)
);

CREATE TABLE materials (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            UUID NOT NULL REFERENCES organizations(id),
  name              VARCHAR(255) NOT NULL,
  code              VARCHAR(50) NOT NULL,
  category          material_category NOT NULL,
  unit_of_measure   VARCHAR(20) NOT NULL, -- kg, g, mg, L, mL, pcs
  description       TEXT,
  storage_conditions TEXT,
  is_active         BOOLEAN DEFAULT true,
  created_by        UUID REFERENCES users(id),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(org_id, code)
);

CREATE TABLE suppliers (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            UUID NOT NULL REFERENCES organizations(id),
  name              VARCHAR(255) NOT NULL,
  code              VARCHAR(50),
  address           TEXT,
  contact_person    VARCHAR(255),
  phone             VARCHAR(20),
  email             VARCHAR(255),
  is_approved       BOOLEAN DEFAULT false,
  approved_by       UUID REFERENCES users(id),
  approved_at       TIMESTAMPTZ,
  is_active         BOOLEAN DEFAULT true,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE material_lots (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            UUID NOT NULL REFERENCES organizations(id),
  material_id       UUID NOT NULL REFERENCES materials(id),
  lot_number        VARCHAR(100) NOT NULL,
  ar_number         VARCHAR(100), -- Analytical Report number
  supplier_id       UUID REFERENCES suppliers(id),
  manufacturer_name VARCHAR(255),
  quantity_received DECIMAL(12,3),
  quantity_remaining DECIMAL(12,3),
  unit_of_measure   VARCHAR(20),
  manufacturing_date DATE,
  expiry_date       DATE,
  retest_date       DATE,
  coa_status        VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
  coa_approved_by   UUID REFERENCES users(id),
  coa_approved_at   TIMESTAMPTZ,
  status            material_lot_status DEFAULT 'quarantine',
  storage_location  VARCHAR(100),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(org_id, material_id, lot_number)
);

CREATE TABLE equipment (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            UUID NOT NULL REFERENCES organizations(id),
  name              VARCHAR(255) NOT NULL,
  code              VARCHAR(50) NOT NULL,
  category          equipment_category NOT NULL,
  make              VARCHAR(255),
  model             VARCHAR(255),
  serial_number     VARCHAR(100),
  location          VARCHAR(255),
  status            equipment_status DEFAULT 'available',
  last_cleaned_at   TIMESTAMPTZ,
  last_cleaned_by   UUID REFERENCES users(id),
  last_used_batch   UUID, -- will reference batches(id)
  last_used_product VARCHAR(255),
  is_active         BOOLEAN DEFAULT true,
  created_by        UUID REFERENCES users(id),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(org_id, code)
);

CREATE TABLE calibration_records (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id      UUID NOT NULL REFERENCES equipment(id),
  calibration_date  DATE NOT NULL,
  next_calibration  DATE NOT NULL,
  calibrated_by     VARCHAR(255),
  certificate_number VARCHAR(100),
  result            VARCHAR(50) DEFAULT 'pass', -- pass, fail
  remarks           TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE maintenance_records (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id      UUID NOT NULL REFERENCES equipment(id),
  maintenance_type  VARCHAR(50), -- preventive, corrective, breakdown
  description       TEXT,
  performed_by      VARCHAR(255),
  performed_at      DATE,
  next_due          DATE,
  remarks           TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE equipment_usage_logs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id      UUID NOT NULL REFERENCES equipment(id),
  batch_id          UUID, -- references batches(id)
  batch_step_id     UUID, -- references batch_steps(id)
  started_at        TIMESTAMPTZ,
  ended_at          TIMESTAMPTZ,
  used_by           UUID REFERENCES users(id),
  cleaning_status   VARCHAR(50), -- clean_before, clean_after
  remarks           TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE cleaning_records (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id      UUID NOT NULL REFERENCES equipment(id),
  cleaned_after_batch UUID, -- references batches(id)
  cleaned_after_product VARCHAR(255),
  cleaning_procedure VARCHAR(255),
  cleaned_by        UUID REFERENCES users(id),
  cleaned_at        TIMESTAMPTZ,
  verified_by       UUID REFERENCES users(id),
  verified_at       TIMESTAMPTZ,
  remarks           TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE areas (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            UUID NOT NULL REFERENCES organizations(id),
  name              VARCHAR(255) NOT NULL,
  code              VARCHAR(50) NOT NULL,
  classification    area_classification DEFAULT 'unclassified',
  location          VARCHAR(255),
  is_active         BOOLEAN DEFAULT true,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(org_id, code)
);


-- ─────────────────────────────────────────────────────────────
-- MASTER BATCH RECORD (Template)
-- ─────────────────────────────────────────────────────────────

CREATE TABLE master_batch_records (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            UUID NOT NULL REFERENCES organizations(id),
  product_id        UUID NOT NULL REFERENCES products(id),
  mbr_number        VARCHAR(100) NOT NULL,
  name              VARCHAR(255) NOT NULL,
  batch_size        DECIMAL(12,3),
  batch_size_unit   VARCHAR(20),
  theoretical_yield DECIMAL(12,3),
  yield_unit        VARCHAR(20),
  yield_min_percent DECIMAL(5,2),
  yield_max_percent DECIMAL(5,2),
  current_version   INTEGER DEFAULT 1,
  status            mbr_status DEFAULT 'draft',
  effective_date    DATE,
  approved_by       UUID REFERENCES users(id),
  approved_at       TIMESTAMPTZ,
  created_by        UUID REFERENCES users(id),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(org_id, mbr_number)
);

CREATE TABLE mbr_versions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mbr_id            UUID NOT NULL REFERENCES master_batch_records(id),
  version_number    INTEGER NOT NULL,
  change_summary    TEXT,
  change_control_id UUID, -- references change_controls(id)
  effective_date    DATE,
  created_by        UUID REFERENCES users(id),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(mbr_id, version_number)
);

CREATE TABLE bom_items (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mbr_id            UUID NOT NULL REFERENCES master_batch_records(id),
  material_id       UUID NOT NULL REFERENCES materials(id),
  quantity          DECIMAL(12,3) NOT NULL,
  unit_of_measure   VARCHAR(20) NOT NULL,
  tolerance_percent DECIMAL(5,2) DEFAULT 0.50,
  is_critical       BOOLEAN DEFAULT false,
  sort_order        INTEGER DEFAULT 0,
  remarks           TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE mbr_steps (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mbr_id            UUID NOT NULL REFERENCES master_batch_records(id),
  step_number       INTEGER NOT NULL,
  step_name         VARCHAR(255) NOT NULL,
  step_type         step_type DEFAULT 'processing',
  instructions      TEXT,
  estimated_duration_minutes INTEGER,
  is_gate           BOOLEAN DEFAULT false, -- blocks next step
  area_id           UUID REFERENCES areas(id),
  sort_order        INTEGER DEFAULT 0,
  
  -- Who can do what
  execution_roles   user_role[] DEFAULT '{operator}',
  verification_roles user_role[] DEFAULT '{supervisor, production_head}',
  
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(mbr_id, step_number)
);

CREATE TABLE mbr_step_parameters (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mbr_step_id       UUID NOT NULL REFERENCES mbr_steps(id) ON DELETE CASCADE,
  parameter_name    VARCHAR(255) NOT NULL,
  parameter_type    parameter_type DEFAULT 'numeric',
  unit_of_measure   VARCHAR(20),
  spec_lower        DECIMAL(10,3),
  spec_upper        DECIMAL(10,3),
  target_value      DECIMAL(10,3),
  selection_options  JSONB, -- for selection type: ["option1", "option2"]
  is_critical       BOOLEAN DEFAULT false,
  sort_order        INTEGER DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE mbr_step_ipc_checks (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mbr_step_id       UUID NOT NULL REFERENCES mbr_steps(id) ON DELETE CASCADE,
  test_name         VARCHAR(255) NOT NULL,
  test_method       VARCHAR(255), -- IP, BP, USP, In-house
  result_type       ipc_result_type DEFAULT 'numeric',
  spec_lower        DECIMAL(10,3),
  spec_upper        DECIMAL(10,3),
  target_value      DECIMAL(10,3),
  sample_size       INTEGER,
  frequency         VARCHAR(100), -- "Every 30 minutes", "Start/Middle/End"
  sort_order        INTEGER DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE mbr_step_equipment (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mbr_step_id       UUID NOT NULL REFERENCES mbr_steps(id) ON DELETE CASCADE,
  equipment_id      UUID NOT NULL REFERENCES equipment(id),
  is_required       BOOLEAN DEFAULT true,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);


-- ─────────────────────────────────────────────────────────────
-- BATCH (Instance of MBR)
-- ─────────────────────────────────────────────────────────────

CREATE TABLE batches (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            UUID NOT NULL REFERENCES organizations(id),
  mbr_id            UUID NOT NULL REFERENCES master_batch_records(id),
  mbr_version       INTEGER NOT NULL,
  product_id        UUID NOT NULL REFERENCES products(id),
  batch_number      VARCHAR(100) NOT NULL,
  batch_size        DECIMAL(12,3),
  batch_size_unit   VARCHAR(20),
  manufacturing_date DATE,
  expiry_date       DATE,
  status            batch_status DEFAULT 'draft',
  
  -- Hold info
  held_at           TIMESTAMPTZ,
  held_by           UUID REFERENCES users(id),
  hold_reason       TEXT,
  resumed_at        TIMESTAMPTZ,
  resumed_by        UUID REFERENCES users(id),
  
  -- Completion
  completed_at      TIMESTAMPTZ,
  completed_by      UUID REFERENCES users(id),
  
  -- Release
  released_at       TIMESTAMPTZ,
  released_by       UUID REFERENCES users(id),
  
  -- Rejection
  rejected_at       TIMESTAMPTZ,
  rejected_by       UUID REFERENCES users(id),
  rejection_reason  TEXT,
  
  created_by        UUID REFERENCES users(id),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(org_id, batch_number)
);

CREATE TABLE line_clearances (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id          UUID NOT NULL REFERENCES batches(id) UNIQUE,
  previous_batch_id UUID REFERENCES batches(id),
  previous_product  VARCHAR(255),
  area_id           UUID REFERENCES areas(id),
  status            line_clearance_status DEFAULT 'pending',
  cleared_by        UUID REFERENCES users(id),
  cleared_at        TIMESTAMPTZ,
  verified_by       UUID REFERENCES users(id),
  verified_at       TIMESTAMPTZ,
  remarks           TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE line_clearance_checks (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  line_clearance_id UUID NOT NULL REFERENCES line_clearances(id) ON DELETE CASCADE,
  checklist_item_id UUID REFERENCES checklist_template_items(id),
  item_text         TEXT NOT NULL,
  is_checked        BOOLEAN DEFAULT false,
  value             VARCHAR(255), -- for items that need a value
  checked_by        UUID REFERENCES users(id),
  checked_at        TIMESTAMPTZ,
  sort_order        INTEGER DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE batch_dispensing_records (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id          UUID NOT NULL REFERENCES batches(id),
  bom_item_id       UUID NOT NULL REFERENCES bom_items(id),
  material_id       UUID NOT NULL REFERENCES materials(id),
  material_lot_id   UUID REFERENCES material_lots(id),
  
  target_quantity   DECIMAL(12,3) NOT NULL,
  actual_quantity   DECIMAL(12,3),
  tolerance_percent DECIMAL(5,2),
  unit_of_measure   VARCHAR(20),
  
  -- Balance info
  balance_id        UUID REFERENCES equipment(id),
  balance_calibration_valid BOOLEAN,
  
  status            dispensing_status DEFAULT 'pending',
  dispensed_by      UUID REFERENCES users(id),
  dispensed_at      TIMESTAMPTZ,
  verified_by       UUID REFERENCES users(id),
  verified_at       TIMESTAMPTZ,
  
  is_within_tolerance BOOLEAN,
  remarks           TEXT,
  sort_order        INTEGER DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE weighing_entries (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispensing_record_id UUID NOT NULL REFERENCES batch_dispensing_records(id),
  container_number  INTEGER NOT NULL,
  gross_weight      DECIMAL(12,3),
  tare_weight       DECIMAL(12,3),
  net_weight        DECIMAL(12,3), -- auto: gross - tare
  unit_of_measure   VARCHAR(20),
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE batch_steps (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id          UUID NOT NULL REFERENCES batches(id),
  mbr_step_id       UUID NOT NULL REFERENCES mbr_steps(id),
  step_number       INTEGER NOT NULL,
  step_name         VARCHAR(255) NOT NULL,
  status            step_status DEFAULT 'pending',
  started_at        TIMESTAMPTZ,
  completed_at      TIMESTAMPTZ,
  
  -- Execution
  performed_by      UUID REFERENCES users(id),
  verified_by       UUID REFERENCES users(id),
  verifier_employee_code VARCHAR(50),
  
  -- Sign-off
  remarks           TEXT,
  
  -- Environmental conditions during step
  area_temperature  DECIMAL(5,2),
  area_humidity     DECIMAL(5,2),
  area_diff_pressure DECIMAL(5,2),
  
  sort_order        INTEGER DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(batch_id, step_number)
);

CREATE TABLE batch_step_parameter_values (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_step_id     UUID NOT NULL REFERENCES batch_steps(id),
  mbr_parameter_id  UUID NOT NULL REFERENCES mbr_step_parameters(id),
  parameter_name    VARCHAR(255),
  recorded_value    VARCHAR(255),
  numeric_value     DECIMAL(10,3),
  spec_lower        DECIMAL(10,3),
  spec_upper        DECIMAL(10,3),
  is_within_spec    BOOLEAN,
  recorded_by       UUID REFERENCES users(id),
  recorded_at       TIMESTAMPTZ DEFAULT NOW(),
  deviation_id      UUID, -- references deviations(id) if OOS triggered
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE batch_step_ipc_results (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_step_id     UUID NOT NULL REFERENCES batch_steps(id),
  mbr_ipc_check_id  UUID NOT NULL REFERENCES mbr_step_ipc_checks(id),
  interval_number   INTEGER DEFAULT 1,
  test_name         VARCHAR(255),
  
  -- For multi-sample IPC
  sample_values     JSONB, -- [498, 502, 499, 501, ...]
  average_value     DECIMAL(10,3),
  min_value         DECIMAL(10,3),
  max_value         DECIMAL(10,3),
  rsd_percent       DECIMAL(5,2),
  
  spec_lower        DECIMAL(10,3),
  spec_upper        DECIMAL(10,3),
  result            VARCHAR(50), -- 'passed', 'failed'
  
  tested_by         UUID REFERENCES users(id),
  tested_at         TIMESTAMPTZ,
  verified_by       UUID REFERENCES users(id),
  verified_at       TIMESTAMPTZ,
  
  deviation_id      UUID, -- references deviations(id) if failed
  remarks           TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE batch_step_equipment_used (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_step_id     UUID NOT NULL REFERENCES batch_steps(id),
  equipment_id      UUID NOT NULL REFERENCES equipment(id),
  start_time        TIMESTAMPTZ,
  end_time          TIMESTAMPTZ,
  operator_id       UUID REFERENCES users(id),
  remarks           TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE environmental_monitoring_logs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id          UUID NOT NULL REFERENCES batches(id),
  batch_step_id     UUID REFERENCES batch_steps(id),
  area_id           UUID REFERENCES areas(id),
  reading_time      TIMESTAMPTZ NOT NULL,
  temperature       DECIMAL(5,2),
  humidity          DECIMAL(5,2),
  diff_pressure     DECIMAL(5,2),
  particle_count    INTEGER,
  is_within_limits  BOOLEAN,
  recorded_by       UUID REFERENCES users(id),
  remarks           TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);


-- ─────────────────────────────────────────────────────────────
-- YIELD & RECONCILIATION
-- ─────────────────────────────────────────────────────────────

CREATE TABLE yield_records (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id          UUID NOT NULL REFERENCES batches(id) UNIQUE,
  theoretical_yield DECIMAL(12,3),
  actual_yield      DECIMAL(12,3),
  yield_unit        VARCHAR(20),
  yield_percentage  DECIMAL(5,2), -- auto: (actual/theoretical)*100
  acceptable_min    DECIMAL(5,2),
  acceptable_max    DECIMAL(5,2),
  is_within_limits  BOOLEAN,
  is_reconciled     BOOLEAN DEFAULT false,
  recorded_by       UUID REFERENCES users(id),
  recorded_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE stage_wise_yields (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  yield_record_id   UUID NOT NULL REFERENCES yield_records(id),
  after_step_id     UUID REFERENCES batch_steps(id),
  stage_name        VARCHAR(255),
  quantity          DECIMAL(12,3),
  unit              VARCHAR(20),
  percentage_of_previous DECIMAL(5,2),
  sort_order        INTEGER DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE material_reconciliations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  yield_record_id   UUID NOT NULL REFERENCES yield_records(id),
  material_id       UUID NOT NULL REFERENCES materials(id),
  quantity_issued   DECIMAL(12,3),
  quantity_used     DECIMAL(12,3),
  quantity_wasted   DECIMAL(12,3),
  quantity_returned DECIMAL(12,3),
  unit              VARCHAR(20),
  is_reconciled     BOOLEAN, -- issued = used + wasted + returned
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE waste_accounts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  yield_record_id   UUID NOT NULL REFERENCES yield_records(id),
  waste_category    VARCHAR(100), -- setup_waste, ipc_samples, rejects, retention
  quantity          DECIMAL(12,3),
  unit              VARCHAR(20),
  remarks           TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);


-- ─────────────────────────────────────────────────────────────
-- DEVIATION & CAPA
-- ─────────────────────────────────────────────────────────────

CREATE TABLE deviations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            UUID NOT NULL REFERENCES organizations(id),
  batch_id          UUID REFERENCES batches(id),
  batch_step_id     UUID REFERENCES batch_steps(id),
  parameter_value_id UUID REFERENCES batch_step_parameter_values(id),
  
  deviation_number  VARCHAR(100) NOT NULL,
  type              deviation_type NOT NULL,
  category          deviation_category NOT NULL,
  severity          deviation_severity NOT NULL,
  title             VARCHAR(500),
  description       TEXT NOT NULL,
  
  -- Impact
  impact_assessment TEXT,
  product_quality_impact VARCHAR(255),
  patient_safety_impact VARCHAR(255),
  
  status            deviation_status DEFAULT 'open',
  
  reported_by       UUID REFERENCES users(id),
  reported_at       TIMESTAMPTZ DEFAULT NOW(),
  
  closed_by         UUID REFERENCES users(id),
  closed_at         TIMESTAMPTZ,
  closure_comments  TEXT,
  
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(org_id, deviation_number)
);

CREATE TABLE investigations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deviation_id      UUID NOT NULL REFERENCES deviations(id) UNIQUE,
  root_cause        TEXT,
  investigation_details TEXT,
  methodology       VARCHAR(100), -- 5_why, fishbone, fault_tree
  investigated_by   UUID REFERENCES users(id),
  started_at        TIMESTAMPTZ,
  completed_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE capas (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deviation_id      UUID NOT NULL REFERENCES deviations(id) UNIQUE,
  corrective_action TEXT,
  preventive_action TEXT,
  due_date          DATE,
  assigned_to       UUID REFERENCES users(id),
  status            capa_status DEFAULT 'open',
  
  effectiveness_check_required BOOLEAN DEFAULT false,
  effectiveness_check_date DATE,
  effectiveness_result TEXT,
  effectiveness_verified_by UUID REFERENCES users(id),
  
  completed_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Link to related/similar deviations
CREATE TABLE related_deviations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deviation_id      UUID NOT NULL REFERENCES deviations(id),
  related_deviation_id UUID NOT NULL REFERENCES deviations(id),
  relationship_type VARCHAR(50), -- similar, root_cause_related, recurring
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  
  CHECK (deviation_id != related_deviation_id)
);


-- ─────────────────────────────────────────────────────────────
-- QA REVIEW
-- ─────────────────────────────────────────────────────────────

CREATE TABLE qa_reviews (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id          UUID NOT NULL REFERENCES batches(id),
  review_stage      INTEGER NOT NULL, -- 1, 2, or 3
  reviewer_id       UUID NOT NULL REFERENCES users(id),
  reviewer_role     user_role NOT NULL,
  
  -- Review content
  ai_summary        TEXT,
  ai_flagged_issues JSONB, -- [{issue: "...", severity: "..."}]
  reviewer_comments TEXT,
  
  -- Checklist
  checklist_completed BOOLEAN DEFAULT false,
  checklist_data    JSONB, -- [{item: "...", checked: true/false}]
  
  decision          qa_review_decision,
  decided_at        TIMESTAMPTZ,
  
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(batch_id, review_stage)
);


-- ─────────────────────────────────────────────────────────────
-- CHANGE CONTROL
-- ─────────────────────────────────────────────────────────────

CREATE TABLE change_controls (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            UUID NOT NULL REFERENCES organizations(id),
  change_number     VARCHAR(100) NOT NULL,
  
  -- What changed
  entity_type       VARCHAR(50), -- 'mbr', 'configuration', 'process'
  entity_id         UUID,
  field_changed     VARCHAR(255),
  previous_value    TEXT,
  new_value         TEXT,
  
  title             VARCHAR(500),
  reason            TEXT NOT NULL,
  impact_assessment TEXT,
  regulatory_impact TEXT,
  
  -- Workflow
  requested_by      UUID REFERENCES users(id),
  requested_at      TIMESTAMPTZ DEFAULT NOW(),
  
  reviewed_by       UUID REFERENCES users(id),
  reviewed_at       TIMESTAMPTZ,
  review_comments   TEXT,
  
  approved_by       UUID REFERENCES users(id),
  approved_at       TIMESTAMPTZ,
  approval_comments TEXT,
  
  effective_date    DATE,
  implemented_at    TIMESTAMPTZ,
  
  status            change_control_status DEFAULT 'requested',
  
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(org_id, change_number)
);


-- ─────────────────────────────────────────────────────────────
-- E-SIGNATURES
-- ─────────────────────────────────────────────────────────────

CREATE TABLE e_signatures (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            UUID NOT NULL REFERENCES organizations(id),
  signer_id         UUID NOT NULL REFERENCES users(id),
  signer_name       VARCHAR(255) NOT NULL,
  signer_role       user_role NOT NULL,
  signer_employee_code VARCHAR(50),
  
  -- What was signed
  entity_type       VARCHAR(50) NOT NULL, -- 'batch_step', 'dispensing', 
                                          -- 'line_clearance', 'qa_review',
                                          -- 'deviation', 'change_control'
  entity_id         UUID NOT NULL,
  
  meaning           e_signature_meaning NOT NULL,
  comments          TEXT,
  
  -- Security
  signed_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address        INET,
  user_agent        TEXT,
  session_id        VARCHAR(255),
  
  -- Integrity
  signature_hash    VARCHAR(255), -- SHA-256 hash of signed data
  data_snapshot     JSONB, -- snapshot of data at time of signing
  
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick lookup
CREATE INDEX idx_esignatures_entity 
  ON e_signatures(entity_type, entity_id);


-- ─────────────────────────────────────────────────────────────
-- SAMPLES
-- ─────────────────────────────────────────────────────────────

CREATE TABLE samples (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            UUID NOT NULL REFERENCES organizations(id),
  batch_id          UUID NOT NULL REFERENCES batches(id),
  batch_step_id     UUID REFERENCES batch_steps(id),
  
  sample_type       VARCHAR(50), -- 'in_process', 'finished_product', 
                                 -- 'retention', 'stability'
  description       VARCHAR(255),
  quantity          DECIMAL(10,3),
  unit              VARCHAR(20),
  
  sent_to           VARCHAR(100), -- 'qc_lab', 'retention_area', 'stability'
  storage_location  VARCHAR(255),
  
  collected_by      UUID REFERENCES users(id),
  collected_at      TIMESTAMPTZ,
  
  retain_until      DATE,
  
  created_at        TIMESTAMPTZ DEFAULT NOW()
);


-- ─────────────────────────────────────────────────────────────
-- AUDIT TRAIL (Immutable, Append-Only)
-- ─────────────────────────────────────────────────────────────

CREATE TABLE audit_trail (
  id                BIGSERIAL PRIMARY KEY, -- sequential, never gaps
  org_id            UUID NOT NULL REFERENCES organizations(id),
  user_id           UUID REFERENCES users(id),
  user_name         VARCHAR(255),
  user_role         user_role,
  
  action            audit_action NOT NULL,
  
  entity_type       VARCHAR(50), -- 'batch', 'step', 'material', etc.
  entity_id         UUID,
  entity_name       VARCHAR(255),
  
  -- Field-level tracking
  field_changed     VARCHAR(255),
  old_value         TEXT,
  new_value         TEXT,
  reason_for_change TEXT,
  
  -- Context
  description       TEXT,
  metadata          JSONB, -- any 