-- Add logo and branding fields to site_settings
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS logo_text text DEFAULT 'Laundry Master';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS logo_size_desktop integer DEFAULT 32;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS logo_size_mobile integer DEFAULT 28;

-- Site-wide managed images table
CREATE TABLE IF NOT EXISTS site_images (
  id serial PRIMARY KEY,
  key text UNIQUE NOT NULL,
  url text NOT NULL DEFAULT '',
  label text NOT NULL,
  section text NOT NULL DEFAULT 'General',
  description text,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Seed all default image slots
INSERT INTO site_images (key, label, section, description) VALUES
  ('article_placeholder_1', 'Article Placeholder 1', 'Articles', 'Fallback thumbnail for articles without a featured image (slot 1 of 4)'),
  ('article_placeholder_2', 'Article Placeholder 2', 'Articles', 'Fallback thumbnail for articles without a featured image (slot 2 of 4)'),
  ('article_placeholder_3', 'Article Placeholder 3', 'Articles', 'Fallback thumbnail for articles without a featured image (slot 3 of 4)'),
  ('article_placeholder_4', 'Article Placeholder 4', 'Articles', 'Fallback thumbnail for articles without a featured image (slot 4 of 4)'),
  ('category_fabric',         'Fabric Science',    'Categories', 'Thumbnail for the Fabric Science category'),
  ('category_laundry',        'Laundry',           'Categories', 'Thumbnail for the Laundry category'),
  ('category_drycleaning',    'Dry Cleaning',      'Categories', 'Thumbnail for the Dry Cleaning category'),
  ('category_stains',         'Stain Removal',     'Categories', 'Thumbnail for the Stain Removal category'),
  ('category_sustainability', 'Sustainability',    'Categories', 'Thumbnail for the Sustainability category'),
  ('home_hero',          'Home Hero',          'Home',          'Background image for the homepage hero section'),
  ('about_hero',         'About Hero',         'About',         'Header image on the About page'),
  ('about_team',         'Team Photo',         'About',         'Team or author group photo on the About page'),
  ('consultation_hero',  'Consultation Hero',  'Consultations', 'Header image on the Book a Consultation page'),
  ('knowledge_hero',     'Knowledge Hub Hero', 'Knowledge',     'Header background for the Knowledge Hub')
ON CONFLICT (key) DO NOTHING;
