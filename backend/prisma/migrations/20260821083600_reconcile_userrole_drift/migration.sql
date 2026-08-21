-- FI360 Drift Reconciliation: UserRole enum
-- This migration reconciles the UserRole enum drift.
-- The actual DB already has these changes applied via a prior db push.
-- This migration captures that state so the migration history is accurate.
-- 
-- Safe to apply: All statements use IF NOT EXISTS / IF EXISTS guards
-- so they are idempotent and non-destructive.

-- Add new enum values (idempotent: will no-op if already present)
DO $$ BEGIN
    ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'CEO';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'FLEET_MANAGER';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'WORKSHOP_MANAGER';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'INVENTORY_MANAGER';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'TYRE_SUPERVISOR';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'TYRE_TECHNICIAN';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'FINANCE_MANAGER';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'DRIVER';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'AUDITOR';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Update default to DRIVER (idempotent)
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'DRIVER';

-- Note: Old enum values (ADMIN, MANAGER, SUPERVISOR, USER) remain in the
-- PostgreSQL enum type. PostgreSQL does not support DROP VALUE from enums.
-- They are unused but harmless. If any row references them, the data is preserved.
