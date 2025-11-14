-- CreateTable
CREATE TABLE "edit_requests" (
    "id" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "changes" JSONB NOT NULL,
    "reason" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isCOI" BOOLEAN NOT NULL DEFAULT false,
    "isFlaggedHealth" BOOLEAN NOT NULL DEFAULT false,
    "isNewPage" BOOLEAN NOT NULL DEFAULT false,
    "hasImages" BOOLEAN NOT NULL DEFAULT false,
    "categories" TEXT[],

    CONSTRAINT "edit_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "link_whitelist" (
    "id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "reason" TEXT,
    "addedBy" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "link_whitelist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "link_blacklist" (
    "id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "reason" TEXT,
    "addedBy" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "link_blacklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moderation_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "moderation_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "edit_requests_status_createdAt_idx" ON "edit_requests"("status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "edit_requests_contentType_status_idx" ON "edit_requests"("contentType", "status");

-- CreateIndex
CREATE INDEX "edit_requests_userId_createdAt_idx" ON "edit_requests"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "edit_requests_isCOI_status_idx" ON "edit_requests"("isCOI", "status");

-- CreateIndex
CREATE INDEX "edit_requests_isFlaggedHealth_status_idx" ON "edit_requests"("isFlaggedHealth", "status");

-- CreateIndex
CREATE INDEX "edit_requests_isNewPage_status_idx" ON "edit_requests"("isNewPage", "status");

-- CreateIndex
CREATE INDEX "edit_requests_reviewedBy_idx" ON "edit_requests"("reviewedBy");

-- CreateIndex
CREATE UNIQUE INDEX "link_whitelist_domain_key" ON "link_whitelist"("domain");

-- CreateIndex
CREATE INDEX "link_whitelist_domain_idx" ON "link_whitelist"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "link_blacklist_domain_key" ON "link_blacklist"("domain");

-- CreateIndex
CREATE INDEX "link_blacklist_domain_idx" ON "link_blacklist"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "moderation_categories_name_key" ON "moderation_categories"("name");

-- CreateIndex
CREATE INDEX "moderation_categories_name_idx" ON "moderation_categories"("name");

-- AddForeignKey
ALTER TABLE "edit_requests" ADD CONSTRAINT "edit_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "edit_requests" ADD CONSTRAINT "edit_requests_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "link_whitelist" ADD CONSTRAINT "link_whitelist_addedBy_fkey" FOREIGN KEY ("addedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "link_blacklist" ADD CONSTRAINT "link_blacklist_addedBy_fkey" FOREIGN KEY ("addedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_categories" ADD CONSTRAINT "moderation_categories_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
