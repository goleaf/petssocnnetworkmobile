-- CreateTable
CREATE TABLE "articles" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "revisions" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "rev" INTEGER NOT NULL,
    "authorId" TEXT NOT NULL,
    "summary" TEXT,
    "contentJSON" JSONB NOT NULL,
    "infoboxJSON" JSONB,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "article_tags" (
    "articleId" TEXT NOT NULL,
    "tag" TEXT NOT NULL,

    CONSTRAINT "article_tags_pkey" PRIMARY KEY ("articleId","tag")
);

-- CreateTable
CREATE TABLE "article_props" (
    "articleId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,

    CONSTRAINT "article_props_pkey" PRIMARY KEY ("articleId","key")
);

-- CreateIndex
CREATE UNIQUE INDEX "articles_slug_type_key" ON "articles"("slug", "type");

-- CreateIndex
CREATE UNIQUE INDEX "revisions_articleId_rev_key" ON "revisions"("articleId", "rev");

-- CreateIndex
CREATE INDEX "revisions_articleId_idx" ON "revisions"("articleId");

-- CreateIndex
CREATE INDEX "revisions_contentJSON_idx" ON "revisions" USING GIN ("contentJSON" jsonb_path_ops);

-- CreateIndex
CREATE INDEX "article_tags_tag_idx" ON "article_tags"("tag");

-- CreateIndex
CREATE INDEX "article_props_articleId_idx" ON "article_props"("articleId");

-- CreateIndex
CREATE INDEX "article_props_value_idx" ON "article_props" USING GIN ("value" jsonb_path_ops);

-- AddForeignKey
ALTER TABLE "revisions" ADD CONSTRAINT "revisions_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_tags" ADD CONSTRAINT "article_tags_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_props" ADD CONSTRAINT "article_props_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

