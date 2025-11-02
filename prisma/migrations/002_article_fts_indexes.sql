-- Enable pg_trgm extension for better text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create article_search_index table for FTS
CREATE TABLE IF NOT EXISTS article_search_index (
  article_id TEXT PRIMARY KEY
);

-- Add content column as tsvector
ALTER TABLE article_search_index ADD COLUMN IF NOT EXISTS content tsvector;

-- Add foreign key constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'article_search_index_article_id_fkey'
  ) THEN
    ALTER TABLE article_search_index 
    ADD CONSTRAINT article_search_index_article_id_fkey 
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create GIN index for article FTS with weights
-- Weights: A=title(1.0), B=type(0.5), C=tags(0.25)
CREATE INDEX IF NOT EXISTS idx_articles_fts ON articles 
  USING GIN(
    setweight(to_tsvector('english', title), 'A') ||
    setweight(to_tsvector('english', COALESCE(type, '')), 'B')
  );

-- Function to extract text from JSONB content
CREATE OR REPLACE FUNCTION jsonb_to_text(jsonb_data jsonb) RETURNS text AS $$
DECLARE
  result text := '';
  element jsonb;
BEGIN
  -- Handle array of blocks
  IF jsonb_typeof(jsonb_data) = 'array' THEN
    FOR element IN SELECT * FROM jsonb_array_elements(jsonb_data)
    LOOP
      IF element ? 'content' THEN
        -- Handle nested content arrays
        IF jsonb_typeof(element->'content') = 'array' THEN
          result := result || ' ' || (SELECT string_agg(value->>'text', ' ')
            FROM jsonb_array_elements(element->'content')
            WHERE jsonb_typeof(value) = 'object'
            AND value ? 'text');
        ELSIF jsonb_typeof(element->'content') = 'string' THEN
          result := result || ' ' || (element->>'content');
        END IF;
      END IF;
      -- Also check for plain text fields
      IF element ? 'text' AND jsonb_typeof(element->>'text') = 'string' THEN
        result := result || ' ' || (element->>'text');
      END IF;
    END LOOP;
  END IF;
  RETURN trim(result);
END;
$$ LANGUAGE plpgsql;

-- Create GIN index on revisions content for tag-based searches
-- This indexes the full JSONB structure for flexible querying
CREATE INDEX IF NOT EXISTS idx_revisions_content_fts 
ON revisions USING GIN(content JSONB_PATH_OPS);

-- Create trigger function to update article search index
CREATE OR REPLACE FUNCTION update_article_fts() RETURNS TRIGGER AS $$
DECLARE
  article_title text;
  article_type text;
  article_tags text;
  latest_rev_content jsonb;
BEGIN
  -- Get article details
  SELECT a.title, a.type, 
         COALESCE(string_agg(at.tag, ' '), '') INTO article_title, article_type, article_tags
  FROM articles a
  LEFT JOIN article_tags at ON a.id = at."articleId"
  WHERE a.id = NEW."articleId"
  GROUP BY a.id, a.title, a.type;

  -- Update search index for article_search_index if exists
  IF EXISTS (
    SELECT 1 FROM article_search_index WHERE article_id = NEW."articleId"
  ) THEN
    UPDATE article_search_index
    SET content = 
      setweight(to_tsvector('english', article_title), 'A') ||
      setweight(to_tsvector('english', COALESCE(article_type, '')), 'B') ||
      setweight(to_tsvector('english', COALESCE(jsonb_to_text(NEW."contentJSON"), '')), 'C')
    WHERE article_id = NEW."articleId";
  ELSE
    INSERT INTO article_search_index (article_id, content)
    VALUES (
      NEW."articleId",
      setweight(to_tsvector('english', article_title), 'A') ||
      setweight(to_tsvector('english', COALESCE(article_type, '')), 'B') ||
      setweight(to_tsvector('english', COALESCE(jsonb_to_text(NEW."contentJSON"), '')), 'C')
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to maintain FTS index when revisions are created/updated
DROP TRIGGER IF EXISTS trigger_article_fts_update ON revisions;
CREATE TRIGGER trigger_article_fts_update
  AFTER INSERT OR UPDATE OF "contentJSON" ON revisions
  FOR EACH ROW
  EXECUTE FUNCTION update_article_fts();

-- Also trigger on article updates (title/type changes)
CREATE OR REPLACE FUNCTION sync_article_fts() RETURNS TRIGGER AS $$
BEGIN
  -- Re-index latest revision for this article
  PERFORM update_article_fts() FROM revisions
  WHERE "articleId" = NEW.id
  ORDER BY rev DESC
  LIMIT 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_article_sync_fts ON articles;
CREATE TRIGGER trigger_article_sync_fts
  AFTER UPDATE OF title, type ON articles
  FOR EACH ROW
  EXECUTE FUNCTION sync_article_fts();

-- Create GIN index on article tags for faster tag searches
CREATE INDEX IF NOT EXISTS idx_article_tags_gin 
ON article_tags USING GIN(tag gin_trgm_ops);

-- Populate search index for existing articles with approved revisions
INSERT INTO article_search_index (article_id, content)
SELECT DISTINCT ON (a.id)
  a.id,
  setweight(to_tsvector('english', a.title), 'A') ||
  setweight(to_tsvector('english', COALESCE(a.type, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(jsonb_to_text(r."contentJSON"), '')), 'C')
FROM articles a
LEFT JOIN revisions r ON a.id = r."articleId"
WHERE r."approvedAt" IS NOT NULL
ORDER BY a.id, r.rev DESC
ON CONFLICT (article_id) DO NOTHING;

