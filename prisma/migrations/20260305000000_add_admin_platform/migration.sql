-- Migration: add_admin_platform
-- Adds Invitation, OrgConfiguration, and LookupCategory models

-- New enums
CREATE TYPE "InvitationStatus" AS ENUM ('pending', 'accepted', 'expired', 'revoked');
CREATE TYPE "NumberingReset" AS ENUM ('yearly', 'monthly', 'never');
CREATE TYPE "ESignatureMethod" AS ENUM ('pin_only', 'password_only', 'password_and_pin');

-- Invitations table
CREATE TABLE "invitations" (
    "id"           TEXT NOT NULL,
    "org_id"        TEXT NOT NULL,
    "email"         TEXT NOT NULL,
    "full_name"     TEXT NOT NULL,
    "employee_id"   TEXT NOT NULL,
    "role"          "UserRole" NOT NULL,
    "department"    TEXT,
    "token"         TEXT NOT NULL,
    "status"        "InvitationStatus" NOT NULL DEFAULT 'pending',
    "expires_at"    TIMESTAMP(3) NOT NULL,
    "invited_by_id" TEXT NOT NULL,
    "accepted_at"   TIMESTAMP(3),
    "created_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invitations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "invitations_token_key" ON "invitations"("token");

ALTER TABLE "invitations"
    ADD CONSTRAINT "invitations_org_id_fkey"
    FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "invitations"
    ADD CONSTRAINT "invitations_invited_by_id_fkey"
    FOREIGN KEY ("invited_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Org configuration table
CREATE TABLE "org_configurations" (
    "id"                        TEXT NOT NULL,
    "org_id"                    TEXT NOT NULL,
    "batch_prefix"              TEXT NOT NULL DEFAULT 'B',
    "batch_number_reset"        "NumberingReset" NOT NULL DEFAULT 'yearly',
    "deviation_prefix"          TEXT NOT NULL DEFAULT 'DEV',
    "change_control_prefix"     TEXT NOT NULL DEFAULT 'CC',
    "qa_review_stages"          INTEGER NOT NULL DEFAULT 2,
    "require_line_clearance"    BOOLEAN NOT NULL DEFAULT true,
    "auto_deviation_on_oos"     BOOLEAN NOT NULL DEFAULT true,
    "critical_deviation_hold"   BOOLEAN NOT NULL DEFAULT true,
    "e_signature_method"        "ESignatureMethod" NOT NULL DEFAULT 'pin_only',
    "session_timeout_minutes"   INTEGER NOT NULL DEFAULT 480,
    "failed_login_lockout"      INTEGER NOT NULL DEFAULT 5,
    "default_yield_min"         DOUBLE PRECISION NOT NULL DEFAULT 95.0,
    "default_yield_max"         DOUBLE PRECISION NOT NULL DEFAULT 102.0,
    "default_material_tolerance" DOUBLE PRECISION NOT NULL DEFAULT 2.0,
    "created_at"                TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"                TIMESTAMP(3) NOT NULL,

    CONSTRAINT "org_configurations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "org_configurations_org_id_key" ON "org_configurations"("org_id");

ALTER TABLE "org_configurations"
    ADD CONSTRAINT "org_configurations_org_id_fkey"
    FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Lookup categories table (ontology layer)
CREATE TABLE "lookup_categories" (
    "id"            TEXT NOT NULL,
    "org_id"        TEXT NOT NULL,
    "category_type" TEXT NOT NULL,
    "value"         TEXT NOT NULL,
    "label"         TEXT NOT NULL,
    "is_system"     BOOLEAN NOT NULL DEFAULT false,
    "is_active"     BOOLEAN NOT NULL DEFAULT true,
    "sort_order"    INTEGER NOT NULL DEFAULT 0,
    "created_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lookup_categories_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "lookup_categories_org_id_category_type_value_key"
    ON "lookup_categories"("org_id", "category_type", "value");

ALTER TABLE "lookup_categories"
    ADD CONSTRAINT "lookup_categories_org_id_fkey"
    FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
