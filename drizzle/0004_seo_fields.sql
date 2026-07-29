-- Additional SEO fields for articles
ALTER TABLE articles ADD COLUMN IF NOT EXISTS primary_keyword text;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS secondary_keywords text;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS search_intent text;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS target_audience text;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS featured_image_alt text;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS og_image_alt text;
