
ALTER TABLE public.analyses 
  ADD COLUMN IF NOT EXISTS conversion_rate numeric,
  ADD COLUMN IF NOT EXISTS bounce_rate numeric,
  ADD COLUMN IF NOT EXISTS task_completion_rate numeric,
  ADD COLUMN IF NOT EXISTS drop_off_rate numeric,
  ADD COLUMN IF NOT EXISTS previous_analysis_id uuid REFERENCES public.analyses(id);
