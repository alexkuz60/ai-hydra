-- Add criteria_scores column to contest_results table
ALTER TABLE public.contest_results
ADD COLUMN criteria_scores jsonb DEFAULT NULL;

-- Comment for clarity
COMMENT ON COLUMN public.contest_results.criteria_scores IS 'JSON object mapping criterion names to scores (e.g., {"Factuality": 8.5, "Relevance": 9.0, ...})';
