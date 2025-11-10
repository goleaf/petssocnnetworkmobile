-- Add questionData and shareComment fields to posts table
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "questionData" JSONB;
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "shareComment" TEXT;
