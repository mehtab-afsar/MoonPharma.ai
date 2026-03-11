-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'production_head', 'supervisor', 'operator', 'qa_reviewer', 'qa_head');

-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('starter', 'professional', 'enterprise');

-- CreateEnum
CREATE TYPE "MaterialType" AS ENUM ('active', 'excipient', 'packaging', 'consumable');

-- CreateEnum
CREATE TYPE "PharmacoepialGrade" AS ENUM ('IP', 'BP', 'USP', 'In_house');

-- CreateEnum
CREATE TYPE "EquipmentStatus" AS ENUM ('available', 'in_use', 'maintenance', 'retired');

-- CreateEnum
CREATE TYPE "MBRStatus" AS ENUM ('draft', 'pending_review', 'approved', 'effective', 'superseded', 'obsolete');

-- CreateEnum
CREATE TYPE "BatchStatus" AS ENUM ('planned', 'in_progress', 'completed', 'under_review', 'approved', 'rejected', 'on_hold');

-- CreateEnum
CREATE TYPE "BatchStepStatus" AS ENUM ('pending', 'in_progress', 'completed', 'skipped_with_deviation');

-- CreateEnum
CREATE TYPE "BatchMaterialStatus" AS ENUM ('pending', 'dispensed', 'verified');

-- CreateEnum
CREATE TYPE "DeviationType" AS ENUM ('planned', 'unplanned');

-- CreateEnum
CREATE TYPE "DeviationCategory" AS ENUM ('process', 'equipment', 'material', 'environmental');

-- CreateEnum
CREATE TYPE "DeviationSeverity" AS ENUM ('minor', 'major', 'critical');

-- CreateEnum
CREATE TYPE "DeviationStatus" AS ENUM ('open', 'under_investigation', 'resolved', 'closed');

-- CreateEnum
CREATE TYPE "SignatureMeaning" AS ENUM ('performed', 'verified', 'reviewed', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'SIGN', 'LOGIN', 'LOGOUT', 'VIEW', 'EXPORT');

-- CreateEnum
CREATE TYPE "ReviewType" AS ENUM ('production_review', 'qa_review', 'qa_head_approval');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('pending', 'in_progress', 'approved', 'rejected', 'returned_for_correction');

-- CreateEnum
CREATE TYPE "ParameterType" AS ENUM ('numeric', 'text', 'boolean', 'selection');

-- CreateEnum
CREATE TYPE "CheckType" AS ENUM ('numeric', 'text', 'pass_fail');

-- CreateEnum
CREATE TYPE "DosageForm" AS ENUM ('Tablet', 'Capsule', 'Syrup', 'Injection', 'Cream', 'Ointment', 'Suspension', 'Solution', 'Powder', 'Granules');

-- CreateEnum
CREATE TYPE "AIInteractionType" AS ENUM ('batch_review', 'deviation_analysis', 'trend_analysis', 'query', 'chat');

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "license_number" TEXT,
    "address" TEXT,
    "gmp_certificate_number" TEXT,
    "subscription_plan" "SubscriptionPlan" NOT NULL DEFAULT 'starter',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "department" TEXT,
    "designation" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "password_changed_at" TIMESTAMP(3),
    "password_expiry_days" INTEGER NOT NULL DEFAULT 90,
    "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMP(3),
    "e_signature_pin_hash" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "logged_in_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "logged_out_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "product_code" TEXT NOT NULL,
    "product_name" TEXT NOT NULL,
    "generic_name" TEXT,
    "dosage_form" "DosageForm" NOT NULL,
    "strength" TEXT NOT NULL,
    "shelf_life_months" INTEGER,
    "storage_conditions" TEXT,
    "regulatory_category" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materials" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "material_code" TEXT NOT NULL,
    "material_name" TEXT NOT NULL,
    "material_type" "MaterialType" NOT NULL,
    "unit_of_measure" TEXT NOT NULL,
    "pharmacoepial_grade" "PharmacoepialGrade",
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "equipment_code" TEXT NOT NULL,
    "equipment_name" TEXT NOT NULL,
    "equipment_type" TEXT NOT NULL,
    "location" TEXT,
    "capacity" TEXT,
    "last_calibration_date" DATE,
    "next_calibration_date" DATE,
    "last_cleaning_date" TIMESTAMP(3),
    "status" "EquipmentStatus" NOT NULL DEFAULT 'available',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master_batch_records" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "mbr_code" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "batch_size_value" DECIMAL(12,3) NOT NULL,
    "batch_size_unit" TEXT NOT NULL,
    "theoretical_yield_value" DECIMAL(12,3),
    "theoretical_yield_unit" TEXT,
    "yield_limit_min" DECIMAL(5,2) NOT NULL DEFAULT 95.00,
    "yield_limit_max" DECIMAL(5,2) NOT NULL DEFAULT 100.00,
    "effective_date" DATE,
    "review_date" DATE,
    "status" "MBRStatus" NOT NULL DEFAULT 'draft',
    "created_by" TEXT NOT NULL,
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "master_batch_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mbr_materials" (
    "id" TEXT NOT NULL,
    "mbr_id" TEXT NOT NULL,
    "material_id" TEXT NOT NULL,
    "quantity" DECIMAL(12,4) NOT NULL,
    "unit" TEXT NOT NULL,
    "tolerance_plus" DECIMAL(5,2),
    "tolerance_minus" DECIMAL(5,2),
    "stage" TEXT,
    "sequence_order" INTEGER NOT NULL,
    "is_critical" BOOLEAN NOT NULL DEFAULT false,
    "instructions" TEXT,

    CONSTRAINT "mbr_materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mbr_steps" (
    "id" TEXT NOT NULL,
    "mbr_id" TEXT NOT NULL,
    "step_number" INTEGER NOT NULL,
    "step_name" TEXT NOT NULL,
    "stage" TEXT,
    "instructions" TEXT NOT NULL,
    "equipment_type" TEXT,
    "estimated_duration_minutes" INTEGER,
    "requires_line_clearance" BOOLEAN NOT NULL DEFAULT false,
    "requires_environmental_check" BOOLEAN NOT NULL DEFAULT false,
    "env_temp_min" DECIMAL(5,2),
    "env_temp_max" DECIMAL(5,2),
    "env_humidity_min" DECIMAL(5,2),
    "env_humidity_max" DECIMAL(5,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mbr_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mbr_step_parameters" (
    "id" TEXT NOT NULL,
    "mbr_step_id" TEXT NOT NULL,
    "parameter_name" TEXT NOT NULL,
    "parameter_type" "ParameterType" NOT NULL,
    "unit" TEXT,
    "target_value" TEXT,
    "min_value" DECIMAL(12,4),
    "max_value" DECIMAL(12,4),
    "selection_options" JSONB,
    "is_critical" BOOLEAN NOT NULL DEFAULT false,
    "sequence_order" INTEGER NOT NULL,

    CONSTRAINT "mbr_step_parameters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mbr_in_process_checks" (
    "id" TEXT NOT NULL,
    "mbr_step_id" TEXT NOT NULL,
    "check_name" TEXT NOT NULL,
    "check_type" "CheckType" NOT NULL,
    "unit" TEXT,
    "specification" TEXT,
    "target_value" DECIMAL(12,4),
    "min_value" DECIMAL(12,4),
    "max_value" DECIMAL(12,4),
    "frequency" TEXT,
    "sample_size" TEXT,
    "is_critical" BOOLEAN NOT NULL DEFAULT false,
    "sequence_order" INTEGER NOT NULL,

    CONSTRAINT "mbr_in_process_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "batches" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "mbr_id" TEXT NOT NULL,
    "batch_number" TEXT NOT NULL,
    "manufacturing_date" DATE NOT NULL,
    "expiry_date" DATE,
    "status" "BatchStatus" NOT NULL DEFAULT 'planned',
    "current_step_number" INTEGER NOT NULL DEFAULT 0,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "actual_yield_value" DECIMAL(12,3),
    "actual_yield_unit" TEXT,
    "yield_percentage" DECIMAL(5,2),
    "initiated_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "batch_materials" (
    "id" TEXT NOT NULL,
    "batch_id" TEXT NOT NULL,
    "mbr_material_id" TEXT NOT NULL,
    "material_id" TEXT NOT NULL,
    "ar_number" TEXT,
    "supplier_batch_number" TEXT,
    "required_quantity" DECIMAL(12,4) NOT NULL,
    "actual_quantity" DECIMAL(12,4),
    "tare_weight" DECIMAL(12,4),
    "gross_weight" DECIMAL(12,4),
    "is_within_tolerance" BOOLEAN,
    "dispensed_by" TEXT,
    "dispensed_at" TIMESTAMP(3),
    "verified_by" TEXT,
    "verified_at" TIMESTAMP(3),
    "status" "BatchMaterialStatus" NOT NULL DEFAULT 'pending',

    CONSTRAINT "batch_materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "batch_steps" (
    "id" TEXT NOT NULL,
    "batch_id" TEXT NOT NULL,
    "mbr_step_id" TEXT NOT NULL,
    "step_number" INTEGER NOT NULL,
    "step_name" TEXT NOT NULL,
    "status" "BatchStepStatus" NOT NULL DEFAULT 'pending',
    "equipment_id" TEXT,
    "equipment_clean_verified" BOOLEAN,
    "area_clean_verified" BOOLEAN,
    "env_temperature" DECIMAL(5,2),
    "env_humidity" DECIMAL(5,2),
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "performed_by" TEXT,
    "performed_at" TIMESTAMP(3),
    "verified_by" TEXT,
    "verified_at" TIMESTAMP(3),
    "remarks" TEXT,

    CONSTRAINT "batch_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "batch_step_parameters" (
    "id" TEXT NOT NULL,
    "batch_step_id" TEXT NOT NULL,
    "mbr_step_parameter_id" TEXT NOT NULL,
    "parameter_name" TEXT NOT NULL,
    "actual_value" TEXT,
    "actual_numeric_value" DECIMAL(12,4),
    "is_within_limit" BOOLEAN,
    "recorded_by" TEXT,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "batch_step_parameters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "batch_ipc_results" (
    "id" TEXT NOT NULL,
    "batch_step_id" TEXT NOT NULL,
    "mbr_ipc_id" TEXT NOT NULL,
    "check_name" TEXT NOT NULL,
    "check_time" TIMESTAMP(3) NOT NULL,
    "result_value" TEXT,
    "result_numeric" DECIMAL(12,4),
    "is_within_spec" BOOLEAN,
    "checked_by" TEXT,
    "verified_by" TEXT,
    "verified_at" TIMESTAMP(3),
    "remarks" TEXT,

    CONSTRAINT "batch_ipc_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deviations" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "batch_id" TEXT NOT NULL,
    "batch_step_id" TEXT,
    "deviation_number" TEXT NOT NULL,
    "deviation_type" "DeviationType" NOT NULL,
    "category" "DeviationCategory" NOT NULL,
    "severity" "DeviationSeverity" NOT NULL,
    "description" TEXT NOT NULL,
    "root_cause" TEXT,
    "impact_assessment" TEXT,
    "corrective_action" TEXT,
    "preventive_action" TEXT,
    "status" "DeviationStatus" NOT NULL DEFAULT 'open',
    "raised_by" TEXT NOT NULL,
    "raised_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_by" TEXT,
    "resolved_at" TIMESTAMP(3),
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),

    CONSTRAINT "deviations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "electronic_signatures" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "record_type" TEXT NOT NULL,
    "record_id" TEXT NOT NULL,
    "signature_meaning" "SignatureMeaning" NOT NULL,
    "full_name" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "designation" TEXT,
    "signed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "signature_hash" TEXT,
    "is_valid" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "electronic_signatures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_trail" (
    "id" BIGSERIAL NOT NULL,
    "org_id" TEXT,
    "user_id" TEXT,
    "user_name" TEXT,
    "user_role" TEXT,
    "action" "AuditAction" NOT NULL,
    "table_name" TEXT NOT NULL,
    "record_id" TEXT NOT NULL,
    "field_name" TEXT,
    "old_value" TEXT,
    "new_value" TEXT,
    "reason_for_change" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_trail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "batch_reviews" (
    "id" TEXT NOT NULL,
    "batch_id" TEXT NOT NULL,
    "review_type" "ReviewType" NOT NULL,
    "reviewer_id" TEXT NOT NULL,
    "status" "ReviewStatus" NOT NULL DEFAULT 'pending',
    "checklist" JSONB,
    "comments" TEXT,
    "ai_review_summary" TEXT,
    "ai_flagged_issues" JSONB,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "batch_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_interactions" (
    "id" TEXT NOT NULL,
    "org_id" TEXT,
    "user_id" TEXT,
    "batch_id" TEXT,
    "interaction_type" "AIInteractionType" NOT NULL,
    "prompt" TEXT,
    "response" TEXT,
    "model_used" TEXT,
    "tokens_used" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_interactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_org_id_employee_id_key" ON "users"("org_id", "employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "products_org_id_product_code_key" ON "products"("org_id", "product_code");

-- CreateIndex
CREATE UNIQUE INDEX "materials_org_id_material_code_key" ON "materials"("org_id", "material_code");

-- CreateIndex
CREATE UNIQUE INDEX "equipment_org_id_equipment_code_key" ON "equipment"("org_id", "equipment_code");

-- CreateIndex
CREATE UNIQUE INDEX "master_batch_records_org_id_mbr_code_version_key" ON "master_batch_records"("org_id", "mbr_code", "version");

-- CreateIndex
CREATE UNIQUE INDEX "batches_batch_number_key" ON "batches"("batch_number");

-- CreateIndex
CREATE UNIQUE INDEX "deviations_deviation_number_key" ON "deviations"("deviation_number");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materials" ADD CONSTRAINT "materials_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "master_batch_records" ADD CONSTRAINT "master_batch_records_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "master_batch_records" ADD CONSTRAINT "master_batch_records_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "master_batch_records" ADD CONSTRAINT "master_batch_records_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "master_batch_records" ADD CONSTRAINT "master_batch_records_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mbr_materials" ADD CONSTRAINT "mbr_materials_mbr_id_fkey" FOREIGN KEY ("mbr_id") REFERENCES "master_batch_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mbr_materials" ADD CONSTRAINT "mbr_materials_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mbr_steps" ADD CONSTRAINT "mbr_steps_mbr_id_fkey" FOREIGN KEY ("mbr_id") REFERENCES "master_batch_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mbr_step_parameters" ADD CONSTRAINT "mbr_step_parameters_mbr_step_id_fkey" FOREIGN KEY ("mbr_step_id") REFERENCES "mbr_steps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mbr_in_process_checks" ADD CONSTRAINT "mbr_in_process_checks_mbr_step_id_fkey" FOREIGN KEY ("mbr_step_id") REFERENCES "mbr_steps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batches" ADD CONSTRAINT "batches_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batches" ADD CONSTRAINT "batches_mbr_id_fkey" FOREIGN KEY ("mbr_id") REFERENCES "master_batch_records"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batches" ADD CONSTRAINT "batches_initiated_by_fkey" FOREIGN KEY ("initiated_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batch_materials" ADD CONSTRAINT "batch_materials_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batch_materials" ADD CONSTRAINT "batch_materials_mbr_material_id_fkey" FOREIGN KEY ("mbr_material_id") REFERENCES "mbr_materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batch_materials" ADD CONSTRAINT "batch_materials_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batch_materials" ADD CONSTRAINT "batch_materials_dispensed_by_fkey" FOREIGN KEY ("dispensed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batch_materials" ADD CONSTRAINT "batch_materials_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batch_steps" ADD CONSTRAINT "batch_steps_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batch_steps" ADD CONSTRAINT "batch_steps_mbr_step_id_fkey" FOREIGN KEY ("mbr_step_id") REFERENCES "mbr_steps"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batch_steps" ADD CONSTRAINT "batch_steps_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "equipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batch_steps" ADD CONSTRAINT "batch_steps_performed_by_fkey" FOREIGN KEY ("performed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batch_steps" ADD CONSTRAINT "batch_steps_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batch_step_parameters" ADD CONSTRAINT "batch_step_parameters_batch_step_id_fkey" FOREIGN KEY ("batch_step_id") REFERENCES "batch_steps"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batch_step_parameters" ADD CONSTRAINT "batch_step_parameters_mbr_step_parameter_id_fkey" FOREIGN KEY ("mbr_step_parameter_id") REFERENCES "mbr_step_parameters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batch_ipc_results" ADD CONSTRAINT "batch_ipc_results_batch_step_id_fkey" FOREIGN KEY ("batch_step_id") REFERENCES "batch_steps"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batch_ipc_results" ADD CONSTRAINT "batch_ipc_results_mbr_ipc_id_fkey" FOREIGN KEY ("mbr_ipc_id") REFERENCES "mbr_in_process_checks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batch_ipc_results" ADD CONSTRAINT "batch_ipc_results_checked_by_fkey" FOREIGN KEY ("checked_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batch_ipc_results" ADD CONSTRAINT "batch_ipc_results_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deviations" ADD CONSTRAINT "deviations_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deviations" ADD CONSTRAINT "deviations_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deviations" ADD CONSTRAINT "deviations_batch_step_id_fkey" FOREIGN KEY ("batch_step_id") REFERENCES "batch_steps"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deviations" ADD CONSTRAINT "deviations_raised_by_fkey" FOREIGN KEY ("raised_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deviations" ADD CONSTRAINT "deviations_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deviations" ADD CONSTRAINT "deviations_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "electronic_signatures" ADD CONSTRAINT "electronic_signatures_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_trail" ADD CONSTRAINT "audit_trail_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_trail" ADD CONSTRAINT "audit_trail_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batch_reviews" ADD CONSTRAINT "batch_reviews_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batch_reviews" ADD CONSTRAINT "batch_reviews_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_interactions" ADD CONSTRAINT "ai_interactions_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_interactions" ADD CONSTRAINT "ai_interactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_interactions" ADD CONSTRAINT "ai_interactions_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
