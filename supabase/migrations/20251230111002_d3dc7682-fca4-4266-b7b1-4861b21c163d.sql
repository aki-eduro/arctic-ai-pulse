-- Add image_url and title_fi columns to articles table
ALTER TABLE public.articles 
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS title_fi TEXT;