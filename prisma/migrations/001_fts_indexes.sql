-- Enable pg_trgm extension for better text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create GIN index for blog post FTS with weights
CREATE INDEX IF NOT EXISTS idx_blog_posts_fts ON blog_posts 
  USING GIN(
    setweight(to_tsvector('english', title), 'A') ||
    setweight(to_tsvector('english', COALESCE(type, '')), 'B') ||
    setweight(to_tsvector('english', content), 'C')
  );

-- Create trigger function to update search index
CREATE OR REPLACE FUNCTION update_blog_post_fts() RETURNS TRIGGER AS $$
BEGIN
  -- Update search index for blog_posts_search_index if exists
  IF EXISTS (
    SELECT 1 FROM blog_post_search_index WHERE post_id = NEW.id
  ) THEN
    UPDATE blog_post_search_index
    SET content = 
      setweight(to_tsvector('english', NEW.title), 'A') ||
      setweight(to_tsvector('english', COALESCE(NEW.type, '')), 'B') ||
      setweight(to_tsvector('english', NEW.content), 'C')
    WHERE post_id = NEW.id;
  ELSE
    INSERT INTO blog_post_search_index (post_id, content)
    VALUES (
      NEW.id,
      setweight(to_tsvector('english', NEW.title), 'A') ||
      setweight(to_tsvector('english', COALESCE(NEW.type, '')), 'B') ||
      setweight(to_tsvector('english', NEW.content), 'C')
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to maintain FTS index
DROP TRIGGER IF EXISTS trigger_blog_post_fts_update ON blog_posts;
CREATE TRIGGER trigger_blog_post_fts_update
  AFTER INSERT OR UPDATE OF title, content, type ON blog_posts
  FOR EACH ROW
  WHEN (NEW.is_draft = false)
  EXECUTE FUNCTION update_blog_post_fts();

-- Create index for synonyms lookup
CREATE INDEX IF NOT EXISTS idx_synonyms_term_gin ON synonyms USING GIN(term gin_trgm_ops);

-- Create composite index for search telemetry
CREATE INDEX IF NOT EXISTS idx_search_telemetry_has_results_created_at 
  ON search_telemetry(has_results, created_at DESC);

-- Seed common synonyms
INSERT INTO synonyms (id, term, synonyms, created_at, updated_at) VALUES
  (gen_random_uuid(), 'gsd', ARRAY['german shepherd', 'german shepherd dog', 'alsatian'], NOW(), NOW()),
  (gen_random_uuid(), 'german shepherd', ARRAY['gsd', 'german shepherd dog', 'alsatian'], NOW(), NOW()),
  (gen_random_uuid(), 'lab', ARRAY['labrador', 'labrador retriever'], NOW(), NOW()),
  (gen_random_uuid(), 'labrador', ARRAY['lab', 'labrador retriever'], NOW(), NOW()),
  (gen_random_uuid(), 'poodle', ARRAY['pood', 'poodle dog'], NOW(), NOW()),
  (gen_random_uuid(), 'golden retriever', ARRAY['golden', 'goldie'], NOW(), NOW()),
  (gen_random_uuid(), 'beagle', ARRAY['beag', 'beagle dog'], NOW(), NOW()),
  (gen_random_uuid(), 'french bulldog', ARRAY['frenchie', 'french bulldog'], NOW(), NOW()),
  (gen_random_uuid(), 'persian', ARRAY['persian cat', 'longhair'], NOW(), NOW()),
  (gen_random_uuid(), 'siamese', ARRAY['siamese cat', 'siamese'], NOW(), NOW()),
  (gen_random_uuid(), 'bengal', ARRAY['bengal cat', 'bengal tiger cat'], NOW(), NOW()),
  (gen_random_uuid(), 'maine coon', ARRAY['maine coon cat', 'coon cat'], NOW(), NOW()),
  (gen_random_uuid(), 'training', ARRAY['train', 'teaching', 'obedience'], NOW(), NOW()),
  (gen_random_uuid(), 'health', ARRAY['wellness', 'medical', 'care'], NOW(), NOW()),
  (gen_random_uuid(), 'nutrition', ARRAY['food', 'diet', 'feeding'], NOW(), NOW())
ON CONFLICT (term) DO NOTHING;

