
-- Create analysis_runs table to store individual AI run outputs
CREATE TABLE public.analysis_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
  run_index INTEGER NOT NULL DEFAULT 1,
  raw_output JSONB NOT NULL DEFAULT '{}'::jsonb,
  overall_score INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.analysis_runs ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own analysis runs" ON public.analysis_runs
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analysis runs" ON public.analysis_runs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own analysis runs" ON public.analysis_runs
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Add confidence fields to analyses table
ALTER TABLE public.analyses
  ADD COLUMN IF NOT EXISTS confidence_score INTEGER,
  ADD COLUMN IF NOT EXISTS run_count INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS analysis_mode TEXT DEFAULT 'fast';
