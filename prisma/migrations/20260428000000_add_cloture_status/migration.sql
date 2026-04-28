-- Add CLOTURE status to Statut enum and closedAt to Ticket
ALTER TYPE "Statut" ADD VALUE IF NOT EXISTS 'CLOTURE';
ALTER TABLE "Ticket" ADD COLUMN IF NOT EXISTS "closedAt" TIMESTAMP(3);
