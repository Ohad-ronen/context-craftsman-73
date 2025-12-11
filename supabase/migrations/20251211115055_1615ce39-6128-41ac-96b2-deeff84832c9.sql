-- Drop columns that are no longer needed
ALTER TABLE public.experiments 
DROP COLUMN IF EXISTS description,
DROP COLUMN IF EXISTS raw_data_sources,
DROP COLUMN IF EXISTS extracted_context,
DROP COLUMN IF EXISTS prompt,
DROP COLUMN IF EXISTS full_injection,
DROP COLUMN IF EXISTS status;

-- Add new columns
ALTER TABLE public.experiments
ADD COLUMN goal text NOT NULL DEFAULT '',
ADD COLUMN mission text NOT NULL DEFAULT '',
ADD COLUMN example text NOT NULL DEFAULT '',
ADD COLUMN desired text NOT NULL DEFAULT '',
ADD COLUMN rules text NOT NULL DEFAULT '',
ADD COLUMN board_name text NOT NULL DEFAULT '',
ADD COLUMN board_full_context text NOT NULL DEFAULT '',
ADD COLUMN board_pulled_context text NOT NULL DEFAULT '',
ADD COLUMN search_terms text NOT NULL DEFAULT '',
ADD COLUMN search_context text NOT NULL DEFAULT '',
ADD COLUMN agentic_prompt text NOT NULL DEFAULT '';