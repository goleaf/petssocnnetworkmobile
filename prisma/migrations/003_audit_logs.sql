-- CreateTable: Audit Log
-- Generic audit log for tracking all admin actions
CREATE TABLE IF NOT EXISTS "audit_logs" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "reason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Audit Queue
-- Fallback queue for audit entries when database is unavailable
CREATE TABLE IF NOT EXISTS "audit_queue" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "reason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastAttempt" TIMESTAMP(3),

    CONSTRAINT "audit_queue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: Audit Logs by Actor
CREATE INDEX IF NOT EXISTS "audit_logs_actorId_idx" ON "audit_logs"("actorId");

-- CreateIndex: Audit Logs by Action
CREATE INDEX IF NOT EXISTS "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex: Audit Logs by Target (composite)
CREATE INDEX IF NOT EXISTS "audit_logs_targetType_targetId_idx" ON "audit_logs"("targetType", "targetId");

-- CreateIndex: Audit Logs by Created Date
CREATE INDEX IF NOT EXISTS "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex: Audit Queue by Created Date
CREATE INDEX IF NOT EXISTS "audit_queue_createdAt_idx" ON "audit_queue"("createdAt");

-- CreateIndex: Audit Queue by Attempts
CREATE INDEX IF NOT EXISTS "audit_queue_attempts_idx" ON "audit_queue"("attempts");

