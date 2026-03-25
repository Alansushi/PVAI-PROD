-- Enable Row Level Security on all tables
-- Prisma connects as a superuser (bypasses RLS), so app functionality is unaffected.
-- This blocks direct access via Supabase PostgREST API (anon/authenticated roles).
-- No permissive policies are added: deny-by-default is the correct posture since
-- the app does not use PostgREST — all DB access goes through Prisma route handlers.

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Organization" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OrgMember" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Project" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProjectMember" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Deliverable" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DeliverableDependency" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GanttRow" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DeliverablePackage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Milestone" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AgentMessage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProjectNote" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProcessedMinuta" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProjectRisk" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProjectKPI" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProcessedReport" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VerificationToken" ENABLE ROW LEVEL SECURITY;
