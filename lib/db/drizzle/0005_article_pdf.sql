-- Migration: add PDF attachment columns to articles
ALTER TABLE articles ADD COLUMN IF NOT EXISTS pdf_url TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS pdf_title TEXT;
