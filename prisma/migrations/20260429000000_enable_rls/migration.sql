-- Enable Row Level Security on all tables
-- The app uses Prisma as the 'postgres' superuser which has BYPASSRLS,
-- so enabling RLS does not affect app queries.
-- This blocks direct anon/PostgREST access (no policy = deny when RLS enabled).

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Technician" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Client" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Ticket" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Historique" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RendezVous" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Photo" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Message" ENABLE ROW LEVEL SECURITY;
