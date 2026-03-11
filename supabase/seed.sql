-- ============================================================
-- MoonPharma eBMR — Supabase Seed Data
-- Run via: supabase db reset
--
-- Login credentials (all users):
--   Password:          Moon@123
--   E-signature PIN:   1234
--   Primary admin:     mehtabafsar346@gmail.com
-- ============================================================

-- Password hash for "Moon@123" (bcrypt cost 12)
-- PIN hash for "1234"      (bcrypt cost 12)

-- ──────────────────────────────────────────────
-- 1. ORGANIZATION
-- ──────────────────────────────────────────────
INSERT INTO organizations (id, name, license_number, address, gmp_certificate_number, subscription_plan, is_active, created_at, updated_at)
VALUES (
  'org-moonpharma-01',
  'MoonPharma Pvt. Ltd.',
  'MFG-IN-2024-0042',
  'Plot 14, Pharma SEZ, Hyderabad, Telangana 500081, India',
  'GMP-CDSCO-2024-0042',
  'professional',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;


-- ──────────────────────────────────────────────
-- 2. USERS (all 6 roles + primary admin)
--    password_hash  = bcrypt("Moon@123", cost=12)
--    e_signature_pin_hash = bcrypt("1234", cost=12)
-- ──────────────────────────────────────────────
INSERT INTO users (id, org_id, employee_id, full_name, email, password_hash, role, department, designation, is_active, e_signature_pin_hash, created_at, updated_at)
VALUES
  -- Admin (primary login)
  ('user-admin-01',      'org-moonpharma-01', 'EMP001', 'Mehtab Afsar',    'mehtabafsar346@gmail.com',      '$2b$12$/l3b4do9hS.D6XHoGS3onerr4ZXH8lymbgJ.a/BmvF.NJutwdIe/q', 'admin',           'IT & Systems',        'System Administrator',    true, '$2b$12$o1JushyvBFU81r59ltei0eZ3j/ZmQ/nJORt6O9ALNN7TCHVzphAGa', NOW(), NOW()),
  -- Production Head
  ('user-prodhead-01',   'org-moonpharma-01', 'EMP002', 'Dr. Ravi Kumar',  'ravi.kumar@moonpharma.com',     '$2b$12$/l3b4do9hS.D6XHoGS3onerr4ZXH8lymbgJ.a/BmvF.NJutwdIe/q', 'production_head', 'Manufacturing',       'Production Head',         true, '$2b$12$o1JushyvBFU81r59ltei0eZ3j/ZmQ/nJORt6O9ALNN7TCHVzphAGa', NOW(), NOW()),
  -- Supervisor
  ('user-supervisor-01', 'org-moonpharma-01', 'EMP003', 'Priya Sharma',    'priya.sharma@moonpharma.com',   '$2b$12$/l3b4do9hS.D6XHoGS3onerr4ZXH8lymbgJ.a/BmvF.NJutwdIe/q', 'supervisor',      'Manufacturing',       'Production Supervisor',   true, '$2b$12$o1JushyvBFU81r59ltei0eZ3j/ZmQ/nJORt6O9ALNN7TCHVzphAGa', NOW(), NOW()),
  -- Operator 1
  ('user-operator-01',   'org-moonpharma-01', 'EMP004', 'Arjun Patel',     'arjun.patel@moonpharma.com',    '$2b$12$/l3b4do9hS.D6XHoGS3onerr4ZXH8lymbgJ.a/BmvF.NJutwdIe/q', 'operator',        'Manufacturing',       'Production Operator',     true, '$2b$12$o1JushyvBFU81r59ltei0eZ3j/ZmQ/nJORt6O9ALNN7TCHVzphAGa', NOW(), NOW()),
  -- Operator 2
  ('user-operator-02',   'org-moonpharma-01', 'EMP005', 'Sneha Reddy',     'sneha.reddy@moonpharma.com',    '$2b$12$/l3b4do9hS.D6XHoGS3onerr4ZXH8lymbgJ.a/BmvF.NJutwdIe/q', 'operator',        'Manufacturing',       'Production Operator',     true, '$2b$12$o1JushyvBFU81r59ltei0eZ3j/ZmQ/nJORt6O9ALNN7TCHVzphAGa', NOW(), NOW()),
  -- QA Reviewer
  ('user-qareviewer-01', 'org-moonpharma-01', 'EMP006', 'Kavita Nair',     'kavita.nair@moonpharma.com',    '$2b$12$/l3b4do9hS.D6XHoGS3onerr4ZXH8lymbgJ.a/BmvF.NJutwdIe/q', 'qa_reviewer',     'Quality Assurance',   'QA Analyst',              true, '$2b$12$o1JushyvBFU81r59ltei0eZ3j/ZmQ/nJORt6O9ALNN7TCHVzphAGa', NOW(), NOW()),
  -- QA Head
  ('user-qahead-01',     'org-moonpharma-01', 'EMP007', 'Dr. Suresh Mehta','suresh.mehta@moonpharma.com',   '$2b$12$/l3b4do9hS.D6XHoGS3onerr4ZXH8lymbgJ.a/BmvF.NJutwdIe/q', 'qa_head',         'Quality Assurance',   'QA Head',                 true, '$2b$12$o1JushyvBFU81r59ltei0eZ3j/ZmQ/nJORt6O9ALNN7TCHVzphAGa', NOW(), NOW())
ON CONFLICT (email) DO NOTHING;


-- ──────────────────────────────────────────────
-- 3. PRODUCTS
-- ──────────────────────────────────────────────
INSERT INTO products (id, org_id, product_code, product_name, generic_name, dosage_form, strength, shelf_life_months, storage_conditions, regulatory_category, is_active, created_at, updated_at)
VALUES
  ('prod-amox-500',    'org-moonpharma-01', 'PRD-0001', 'Amoxicillin',    'Amoxicillin Trihydrate',       'Capsule', '500 mg', 24, 'Store below 25°C, protect from moisture', 'Schedule H',  true, NOW(), NOW()),
  ('prod-metro-400',   'org-moonpharma-01', 'PRD-0002', 'Metronidazole',  'Metronidazole',                'Tablet',  '400 mg', 36, 'Store below 30°C, protect from light',    'Schedule H',  true, NOW(), NOW()),
  ('prod-paracet-500', 'org-moonpharma-01', 'PRD-0003', 'Paracetamol',    'Paracetamol (Acetaminophen)',  'Tablet',  '500 mg', 36, 'Store below 30°C',                        'OTC',         true, NOW(), NOW()),
  ('prod-cipro-250',   'org-moonpharma-01', 'PRD-0004', 'Ciprofloxacin',  'Ciprofloxacin Hydrochloride',  'Tablet',  '250 mg', 30, 'Store below 25°C',                        'Schedule H1', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;


-- ──────────────────────────────────────────────
-- 4. MATERIALS
-- ──────────────────────────────────────────────
INSERT INTO materials (id, org_id, material_code, material_name, material_type, unit_of_measure, pharmacoepial_grade, is_active, created_at)
VALUES
  -- APIs
  ('mat-amox-api',    'org-moonpharma-01', 'MAT-0001', 'Amoxicillin Trihydrate',             'active',     'kg',    'BP',  true, NOW()),
  ('mat-metro-api',   'org-moonpharma-01', 'MAT-0002', 'Metronidazole API',                  'active',     'kg',    'IP',  true, NOW()),
  ('mat-paracet-api', 'org-moonpharma-01', 'MAT-0003', 'Paracetamol API',                    'active',     'kg',    'IP',  true, NOW()),
  ('mat-cipro-api',   'org-moonpharma-01', 'MAT-0004', 'Ciprofloxacin HCl API',              'active',     'kg',    'USP', true, NOW()),
  -- Excipients
  ('mat-mcc',         'org-moonpharma-01', 'MAT-0005', 'Microcrystalline Cellulose (MCC)',   'excipient',  'kg',    'IP',  true, NOW()),
  ('mat-lactose',     'org-moonpharma-01', 'MAT-0006', 'Lactose Monohydrate',                'excipient',  'kg',    'BP',  true, NOW()),
  ('mat-starch',      'org-moonpharma-01', 'MAT-0007', 'Maize Starch',                       'excipient',  'kg',    'IP',  true, NOW()),
  ('mat-mg-stearate', 'org-moonpharma-01', 'MAT-0008', 'Magnesium Stearate',                 'excipient',  'kg',    'IP',  true, NOW()),
  ('mat-pvp',         'org-moonpharma-01', 'MAT-0009', 'Polyvinylpyrrolidone K30 (PVP K30)', 'excipient',  'kg',    'USP', true, NOW()),
  ('mat-talc',        'org-moonpharma-01', 'MAT-0010', 'Talc (Purified)',                    'excipient',  'kg',    'IP',  true, NOW()),
  -- Packaging
  ('mat-caps',        'org-moonpharma-01', 'MAT-0011', 'Hard Gelatin Capsules Size 1',       'packaging',  'units', NULL,  true, NOW()),
  ('mat-blister',     'org-moonpharma-01', 'MAT-0012', 'Aluminium Foil Blister',             'packaging',  'm2',    NULL,  true, NOW()),
  ('mat-bottle',      'org-moonpharma-01', 'MAT-0013', 'HDPE Bottle 100ml',                  'packaging',  'units', NULL,  true, NOW()),
  -- Consumables
  ('mat-ipa',         'org-moonpharma-01', 'MAT-0014', 'Isopropyl Alcohol 70%',              'consumable', 'L',     'IP',  true, NOW()),
  ('mat-purwater',    'org-moonpharma-01', 'MAT-0015', 'Purified Water',                     'consumable', 'L',     'IP',  true, NOW())
ON CONFLICT (id) DO NOTHING;


-- ──────────────────────────────────────────────
-- 5. EQUIPMENT
-- ──────────────────────────────────────────────
INSERT INTO equipment (id, org_id, equipment_code, equipment_name, equipment_type, location, capacity, status, last_calibration_date, next_calibration_date, is_active, created_at)
VALUES
  ('eq-blender-01',    'org-moonpharma-01', 'EQ-BL-001',  'Octagonal Blender',                   'Blender',       'Manufacturing Floor A', '200 kg',           'available', '2025-10-01', '2026-04-01', true, NOW()),
  ('eq-granulator-01', 'org-moonpharma-01', 'EQ-GR-001',  'Rapid Mixer Granulator',              'Granulator',    'Manufacturing Floor A', '150 kg',           'available', '2025-09-15', '2026-03-15', true, NOW()),
  ('eq-dryer-01',      'org-moonpharma-01', 'EQ-FBD-001', 'Fluid Bed Dryer',                     'Dryer',         'Manufacturing Floor A', '100 kg',           'available', '2025-11-01', '2026-05-01', true, NOW()),
  ('eq-tablet-01',     'org-moonpharma-01', 'EQ-TC-001',  'Rotary Tablet Compression Machine',   'Tablet Press',  'Manufacturing Floor B', '200,000 tabs/hr',  'available', '2025-10-15', '2026-04-15', true, NOW()),
  ('eq-capsule-01',    'org-moonpharma-01', 'EQ-CF-001',  'Capsule Filling Machine',             'Capsule Filler','Manufacturing Floor B', '60,000 caps/hr',   'in_use',    '2025-08-01', '2026-02-01', true, NOW()),
  ('eq-coater-01',     'org-moonpharma-01', 'EQ-FC-001',  'Film Coating Pan',                    'Coating Pan',   'Manufacturing Floor B', '100 kg',           'available', '2025-12-01', '2026-06-01', true, NOW()),
  ('eq-balance-01',    'org-moonpharma-01', 'EQ-BAL-001', 'Analytical Balance (0.0001g)',        'Balance',       'Dispensing Area',       '220g',             'available', '2026-01-01', '2026-07-01', true, NOW()),
  ('eq-balance-02',    'org-moonpharma-01', 'EQ-BAL-002', 'Platform Balance (10kg)',             'Balance',       'Dispensing Area',       '10 kg',            'available', '2026-01-01', '2026-07-01', true, NOW())
ON CONFLICT (id) DO NOTHING;


-- ──────────────────────────────────────────────
-- 6. MASTER BATCH RECORDS
-- ──────────────────────────────────────────────
INSERT INTO master_batch_records (id, org_id, product_id, mbr_code, version, batch_size_value, batch_size_unit, theoretical_yield_value, theoretical_yield_unit, yield_limit_min, yield_limit_max, effective_date, review_date, status, created_by, approved_by, approved_at, created_at, updated_at)
VALUES
  -- Amoxicillin 500mg — fully approved with steps/params
  ('mbr-amox-500-v1',   'org-moonpharma-01', 'prod-amox-500',    'MBR-AMOX-500',  1, 100.000, 'kg', 200000.000, 'capsules', 95.00, 100.00, '2024-01-15', '2026-01-15', 'approved',        'user-prodhead-01', 'user-qahead-01', '2024-01-15 00:00:00', NOW(), NOW()),
  -- Metronidazole 400mg — approved (no steps seeded for brevity)
  ('mbr-metro-400-v1',  'org-moonpharma-01', 'prod-metro-400',   'MBR-METRO-400', 1, 100.000, 'kg', 250000.000, 'tablets',  95.00, 100.00, '2024-03-01', NULL,         'approved',        'user-prodhead-01', 'user-qahead-01', '2024-03-01 00:00:00', NOW(), NOW()),
  -- Paracetamol 500mg — draft pending review
  ('mbr-paracet-500-v1','org-moonpharma-01', 'prod-paracet-500', 'MBR-PARA-500',  1, 200.000, 'kg', 400000.000, 'tablets',  95.00, 100.00, NULL,         NULL,         'pending_review',  'user-prodhead-01', NULL,             NULL,                  NOW(), NOW())
ON CONFLICT (id) DO NOTHING;


-- ──────────────────────────────────────────────
-- 7. MBR MATERIALS (BOM for Amoxicillin 500mg)
-- ──────────────────────────────────────────────
INSERT INTO mbr_materials (id, mbr_id, material_id, quantity, unit, tolerance_plus, tolerance_minus, stage, sequence_order, is_critical, instructions)
VALUES
  ('mbr-mat-01', 'mbr-amox-500-v1', 'mat-amox-api',    55.5000, 'kg',    2.00, 2.00, 'Dispensing',   1, true,  'Weigh accurately using calibrated platform balance'),
  ('mbr-mat-02', 'mbr-amox-500-v1', 'mat-mcc',         25.0000, 'kg',    1.00, 1.00, 'Dispensing',   2, false, 'Weigh in dispensing area'),
  ('mbr-mat-03', 'mbr-amox-500-v1', 'mat-lactose',     12.0000, 'kg',    1.00, 1.00, 'Dispensing',   3, false, 'Weigh in dispensing area'),
  ('mbr-mat-04', 'mbr-amox-500-v1', 'mat-pvp',          3.5000, 'kg',    0.50, 0.50, 'Granulation',  4, false, 'Dissolve in purified water before use'),
  ('mbr-mat-05', 'mbr-amox-500-v1', 'mat-mg-stearate',  1.0000, 'kg',    0.10, 0.10, 'Blending',     5, true,  'Weigh accurately — critical for lubrication'),
  ('mbr-mat-06', 'mbr-amox-500-v1', 'mat-talc',         1.5000, 'kg',    0.20, 0.20, 'Blending',     6, false, 'Sift through 60 mesh before use'),
  ('mbr-mat-07', 'mbr-amox-500-v1', 'mat-caps',    200000.0000, 'units', 500.00, 0.00,'Encapsulation',7, false, 'Check capsule size 1 before use'),
  ('mbr-mat-08', 'mbr-amox-500-v1', 'mat-purwater',    15.0000, 'L',     1.00, 1.00, 'Granulation',  8, false, 'Use freshly prepared purified water')
ON CONFLICT (id) DO NOTHING;


-- ──────────────────────────────────────────────
-- 8. MBR STEPS (10 steps for Amoxicillin 500mg)
-- ──────────────────────────────────────────────
INSERT INTO mbr_steps (id, mbr_id, step_number, step_name, stage, instructions, equipment_type, estimated_duration_minutes, requires_line_clearance, requires_environmental_check, env_temp_min, env_temp_max, env_humidity_min, env_humidity_max, created_at)
VALUES
  ('step-01', 'mbr-amox-500-v1',  1, 'Line Clearance & Area Preparation', 'Preparation',   'Verify that the manufacturing area is clean and free from any previous batch materials. Check area temperature and relative humidity. Verify all equipment is clean and properly calibrated. Obtain line clearance certificate signed by QA.', 'General Area',   30,  true,  true,  20.00, 25.00, 40.00, 60.00, NOW()),
  ('step-02', 'mbr-amox-500-v1',  2, 'Dispensing of Raw Materials',        'Dispensing',    'Dispense all raw materials as per the Bill of Materials. Use calibrated balances. Each weighing must be verified by a second person. Record AR numbers and supplier batch numbers for all materials.',                                       'Balance',        60,  false, false, NULL,  NULL,  NULL,  NULL,  NOW()),
  ('step-03', 'mbr-amox-500-v1',  3, 'Dry Mixing (Pre-Granulation)',       'Granulation',   'Transfer Amoxicillin Trihydrate, MCC, and Lactose Monohydrate into the Rapid Mixer Granulator. Mix at slow speed for 5 minutes. Check blend uniformity visually.',                                                                         'Granulator',     20,  false, false, NULL,  NULL,  NULL,  NULL,  NOW()),
  ('step-04', 'mbr-amox-500-v1',  4, 'Wet Granulation',                    'Granulation',   'Prepare binder solution by dissolving PVP K30 in purified water. Add binder solution slowly to the dry mix in RMG while mixing. Continue granulation until wet mass is formed. Assess end point by squeeze test.',                          'Granulator',     45,  false, false, NULL,  NULL,  NULL,  NULL,  NOW()),
  ('step-05', 'mbr-amox-500-v1',  5, 'Drying (Fluid Bed Drying)',          'Drying',        'Transfer the wet granules to Fluid Bed Dryer. Dry at inlet air temperature 55-60°C until LOD ≤ 2.0%. Sample every 30 minutes and record LOD values. Stop drying when target LOD is achieved.',                                            'Dryer',         180,  false, false, NULL,  NULL,  NULL,  NULL,  NOW()),
  ('step-06', 'mbr-amox-500-v1',  6, 'Milling & Sizing',                   'Milling',       'Mill the dried granules through 20 mesh screen. Collect milled granules and record weight. Calculate yield of milling stage.',                                                                                                             'Mill',           30,  false, false, NULL,  NULL,  NULL,  NULL,  NOW()),
  ('step-07', 'mbr-amox-500-v1',  7, 'Lubrication & Final Blending',       'Blending',      'Sift Magnesium Stearate and Talc through 60 mesh. Add to milled granules in Octagonal Blender. Mix for exactly 5 minutes at recommended speed. Do not over-blend — critical step.',                                                       'Blender',        25,  false, false, NULL,  NULL,  NULL,  NULL,  NOW()),
  ('step-08', 'mbr-amox-500-v1',  8, 'Encapsulation',                      'Encapsulation', 'Transfer final blend to Capsule Filling Machine. Set target fill weight to 500mg ± 5%. Perform weight variation checks every 30 minutes. Fill capsules into approved size 1 hard gelatin capsules.',                                       'Capsule Filler',240,  false, true,  20.00, 25.00, 40.00, 55.00, NOW()),
  ('step-09', 'mbr-amox-500-v1',  9, 'In-Process Quality Checks',          'Quality Check', 'Perform in-process quality checks: weight variation, disintegration time, visual inspection for defects. Record all results. Any out-of-specification result must be investigated immediately.',                                            'Balance',        60,  false, false, NULL,  NULL,  NULL,  NULL,  NOW()),
  ('step-10', 'mbr-amox-500-v1', 10, 'Yield Calculation & Batch Completion','Completion',   'Count total capsules produced. Calculate theoretical yield, actual yield, and percentage yield. Record all batch details. Collect retained samples. Transfer to QA for batch record review.',                                               'General Area',   30,  false, false, NULL,  NULL,  NULL,  NULL,  NOW())
ON CONFLICT (id) DO NOTHING;


-- ──────────────────────────────────────────────
-- 9. MBR STEP PARAMETERS
-- ──────────────────────────────────────────────
INSERT INTO mbr_step_parameters (id, mbr_step_id, parameter_name, parameter_type, unit, target_value, min_value, max_value, selection_options, is_critical, sequence_order)
VALUES
  -- Step 1: Line clearance
  ('param-01-01', 'step-01', 'Area Temperature (°C)',          'numeric',   '°C',  NULL,  20.0000, 25.0000, NULL,                                                       true,  1),
  ('param-01-02', 'step-01', 'Relative Humidity (%)',           'numeric',   '%',   NULL,  40.0000, 60.0000, NULL,                                                       true,  2),
  ('param-01-03', 'step-01', 'Line Clearance Certificate No.',  'text',      NULL,  NULL,  NULL,    NULL,    NULL,                                                       true,  3),
  -- Step 3: Dry mixing
  ('param-03-01', 'step-03', 'Mixing Speed',                    'selection', NULL,  'Slow (180 rpm)', NULL, NULL, '["Slow (180 rpm)","Medium (280 rpm)","Fast (380 rpm)"]'::jsonb, false, 1),
  ('param-03-02', 'step-03', 'Mixing Time (minutes)',            'numeric',   'min', '5',   4.0000,  6.0000,  NULL,                                                      false, 2),
  -- Step 4: Wet granulation
  ('param-04-01', 'step-04', 'Binder Solution Temperature (°C)','numeric',   '°C',  NULL,  25.0000, 35.0000, NULL,                                                       false, 1),
  ('param-04-02', 'step-04', 'Granulation End Point',           'selection', NULL,  'Satisfactory', NULL, NULL, '["Satisfactory","Unsatisfactory"]'::jsonb,             true,  2),
  -- Step 5: Drying
  ('param-05-01', 'step-05', 'Inlet Air Temperature (°C)',      'numeric',   '°C',  NULL,  55.0000, 65.0000, NULL,                                                       true,  1),
  ('param-05-02', 'step-05', 'Final LOD (%)',                   'numeric',   '%',   NULL,   0.0000,  2.0000, NULL,                                                       true,  2),
  ('param-05-03', 'step-05', 'Drying Time (minutes)',           'numeric',   'min', NULL,  NULL,    NULL,    NULL,                                                       false, 3),
  -- Step 7: Lubrication
  ('param-07-01', 'step-07', 'Blending Time (minutes)',          'numeric',   'min', '5',   4.0000,  6.0000,  NULL,                                                      true,  1),
  ('param-07-02', 'step-07', 'Blender Speed (rpm)',             'numeric',   'rpm', NULL,   8.0000, 12.0000, NULL,                                                       false, 2),
  -- Step 8: Encapsulation
  ('param-08-01', 'step-08', 'Target Fill Weight (mg)',         'numeric',   'mg',  '500', 475.0000,525.0000, NULL,                                                      true,  1),
  ('param-08-02', 'step-08', 'Area Temperature (°C)',           'numeric',   '°C',  NULL,  20.0000, 25.0000, NULL,                                                       true,  2),
  ('param-08-03', 'step-08', 'Area Humidity (%)',               'numeric',   '%',   NULL,  40.0000, 55.0000, NULL,                                                       true,  3),
  -- Step 10: Yield
  ('param-10-01', 'step-10', 'Total Capsules Filled (units)',   'numeric',   'units',NULL, NULL,    NULL,    NULL,                                                       true,  1),
  ('param-10-02', 'step-10', 'Percentage Yield (%)',            'numeric',   '%',   NULL,  95.0000,100.0000, NULL,                                                       true,  2),
  ('param-10-03', 'step-10', 'Retained Sample Quantity',        'text',      NULL,  NULL,  NULL,    NULL,    NULL,                                                       false, 3)
ON CONFLICT (id) DO NOTHING;


-- ──────────────────────────────────────────────
-- 10. MBR IN-PROCESS CHECKS (IPC)
-- ──────────────────────────────────────────────
INSERT INTO mbr_in_process_checks (id, mbr_step_id, check_name, check_type, unit, specification, target_value, min_value, max_value, frequency, sample_size, is_critical, sequence_order)
VALUES
  -- Step 5: Drying LOD checks
  ('ipc-05-01', 'step-05', 'LOD at 30 min',                'numeric',    '%',   'Record value',             NULL, NULL, NULL, 'Every 30 minutes', NULL,            false, 1),
  ('ipc-05-02', 'step-05', 'LOD at 60 min',                'numeric',    '%',   'Record value',             NULL, NULL, NULL, 'Every 30 minutes', NULL,            false, 2),
  ('ipc-05-03', 'step-05', 'Final LOD',                    'numeric',    '%',   'NMT 2.0%',                 NULL, 0.00, 2.00, 'Final',            NULL,            true,  3),
  -- Step 8: Encapsulation checks
  ('ipc-08-01', 'step-08', 'Average Weight of 20 Capsules','numeric',    'mg',  '500 mg ± 5%',              NULL, 475.00,525.00,'Every 30 minutes','20 capsules',  true,  1),
  ('ipc-08-02', 'step-08', 'Individual Weight Variation',  'pass_fail',  NULL,  'Within ±7.5% of average',  NULL, NULL, NULL, 'Every 30 minutes', '20 capsules',  true,  2),
  ('ipc-08-03', 'step-08', 'Visual Inspection (Defects)',  'pass_fail',  NULL,  'No visible defects, ≤0.1% AQL', NULL, NULL, NULL,'Every 30 minutes','100 capsules',false, 3),
  -- Step 9: Quality checks
  ('ipc-09-01', 'step-09', 'Disintegration Time',          'numeric',    'min', 'NMT 30 minutes',           NULL, NULL, 30.00,'Once per batch',   '6 capsules',   true,  1),
  ('ipc-09-02', 'step-09', 'Appearance — Color',           'pass_fail',  NULL,  'White/Off-white, uniform', NULL, NULL, NULL, 'Once per batch',   NULL,            false, 2)
ON CONFLICT (id) DO NOTHING;


-- ──────────────────────────────────────────────
-- 11. BATCHES
-- ──────────────────────────────────────────────
INSERT INTO batches (id, org_id, mbr_id, batch_number, manufacturing_date, expiry_date, status, current_step_number, started_at, completed_at, actual_yield_value, actual_yield_unit, yield_percentage, initiated_by, created_at, updated_at)
VALUES
  -- In progress
  ('batch-001', 'org-moonpharma-01', 'mbr-amox-500-v1', 'BN-2026-0001', '2026-03-01', '2028-03-01', 'in_progress',  3,  '2026-03-01 08:00:00', NULL,                  NULL,       NULL,        NULL,  'user-supervisor-01', NOW(), NOW()),
  -- Under review (completed)
  ('batch-002', 'org-moonpharma-01', 'mbr-amox-500-v1', 'BN-2026-0002', '2026-02-15', '2028-02-15', 'under_review', 10, '2026-02-15 08:00:00', '2026-02-16 18:00:00', 196500.000, 'capsules',  98.25, 'user-supervisor-01', NOW(), NOW()),
  -- Approved
  ('batch-003', 'org-moonpharma-01', 'mbr-amox-500-v1', 'BN-2026-0003', '2026-01-20', '2028-01-20', 'approved',     10, '2026-01-20 08:00:00', '2026-01-21 17:00:00', 198000.000, 'capsules',  99.00, 'user-supervisor-01', NOW(), NOW()),
  -- Planned
  ('batch-004', 'org-moonpharma-01', 'mbr-amox-500-v1', 'BN-2026-0004', '2026-03-10', '2028-03-10', 'planned',      0,  NULL,                  NULL,                  NULL,       NULL,        NULL,  'user-supervisor-01', NOW(), NOW())
ON CONFLICT (batch_number) DO NOTHING;


-- ──────────────────────────────────────────────
-- 12. DEVIATIONS
-- ──────────────────────────────────────────────
INSERT INTO deviations (id, org_id, batch_id, batch_step_id, deviation_number, deviation_type, category, severity, description, root_cause, impact_assessment, corrective_action, preventive_action, status, raised_by, raised_at, resolved_by, resolved_at, approved_by, approved_at)
VALUES
  (
    'dev-001', 'org-moonpharma-01', 'batch-002', NULL,
    'DEV-2026-0001', 'unplanned', 'process', 'minor',
    'LOD value at 60 min drying was 2.8% against specification of NMT 2.0%. Extended drying for additional 30 minutes.',
    'Initial granule particle size was larger than expected due to high moisture content of API.',
    'No significant impact on product quality. Final LOD achieved within specification after extended drying.',
    'Extended drying time by 30 minutes. Final LOD confirmed at 1.8% before proceeding.',
    'Review incoming API moisture specifications. Add pre-drying step if API moisture exceeds 3.0%.',
    'closed',
    'user-operator-01', '2026-02-15 14:30:00',
    'user-supervisor-01', '2026-02-15 17:00:00',
    'user-qareviewer-01', '2026-02-15 18:00:00'
  ),
  (
    'dev-002', 'org-moonpharma-01', 'batch-001', NULL,
    'DEV-2026-0002', 'unplanned', 'equipment', 'major',
    'Capsule filling machine stopped unexpectedly during encapsulation due to a mechanical jam. Machine was offline for 45 minutes.',
    'Under investigation', 'Under investigation',
    NULL, NULL,
    'under_investigation',
    'user-operator-01', '2026-03-02 11:00:00',
    NULL, NULL, NULL, NULL
  ),
  (
    'dev-003', 'org-moonpharma-01', 'batch-001', NULL,
    'DEV-2026-0003', 'unplanned', 'environmental', 'minor',
    'Encapsulation area RH was found at 57% against the specification of 40-55% for a period of approximately 20 minutes.',
    NULL, NULL, NULL, NULL,
    'open',
    'user-supervisor-01', '2026-03-02 14:00:00',
    NULL, NULL, NULL, NULL
  )
ON CONFLICT (deviation_number) DO NOTHING;


-- ──────────────────────────────────────────────
-- 13. BATCH REVIEWS
-- ──────────────────────────────────────────────
INSERT INTO batch_reviews (id, batch_id, review_type, reviewer_id, status, comments, started_at, completed_at, created_at)
VALUES
  ('review-002-qa',   'batch-002', 'qa_review',         'user-qareviewer-01', 'in_progress', 'Batch record received for review. Initial check in progress.',                    '2026-02-17 09:00:00', NULL,                  NOW()),
  ('review-003-qa',   'batch-003', 'qa_review',         'user-qareviewer-01', 'approved',    'All records are complete. No critical deviations. Yield within specification.',   '2026-01-22 09:00:00', '2026-01-22 16:00:00', NOW()),
  ('review-003-head', 'batch-003', 'qa_head_approval',  'user-qahead-01',     'approved',    'Batch approved for release. All specifications met.',                             '2026-01-23 10:00:00', '2026-01-23 11:00:00', NOW())
ON CONFLICT (id) DO NOTHING;


-- ──────────────────────────────────────────────
-- 14. AUDIT TRAIL (sample entries)
-- ──────────────────────────────────────────────
INSERT INTO audit_trail (org_id, user_id, user_name, user_role, action, table_name, record_id, created_at)
VALUES
  ('org-moonpharma-01', 'user-admin-01',      'Mehtab Afsar',    'admin',           'LOGIN',  'users',                 'user-admin-01',      NOW()),
  ('org-moonpharma-01', 'user-prodhead-01',   'Dr. Ravi Kumar',  'production_head', 'CREATE', 'master_batch_records',  'mbr-amox-500-v1',    NOW()),
  ('org-moonpharma-01', 'user-qahead-01',     'Dr. Suresh Mehta','qa_head',         'SIGN',   'master_batch_records',  'mbr-amox-500-v1',    NOW()),
  ('org-moonpharma-01', 'user-supervisor-01', 'Priya Sharma',    'supervisor',      'CREATE', 'batches',               'batch-001',          NOW()),
  ('org-moonpharma-01', 'user-operator-01',   'Arjun Patel',     'operator',        'CREATE', 'deviations',            'dev-002',            NOW());
