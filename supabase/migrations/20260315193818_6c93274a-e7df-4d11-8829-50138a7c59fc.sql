
-- Create analyses table
CREATE TABLE public.analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL,
  page_title TEXT,
  screenshot_url TEXT,
  summary TEXT,
  overall_score INTEGER,
  navigation_clarity_score INTEGER,
  information_hierarchy_score INTEGER,
  feedback_visibility_score INTEGER,
  error_prevention_score INTEGER,
  interaction_efficiency_score INTEGER,
  heuristic_violations JSONB DEFAULT '[]'::jsonb,
  recommendations JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read and insert (no auth required for this tool)
CREATE POLICY "Anyone can view analyses" ON public.analyses FOR SELECT USING (true);
CREATE POLICY "Anyone can create analyses" ON public.analyses FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update analyses" ON public.analyses FOR UPDATE USING (true);

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_analyses_updated_at
  BEFORE UPDATE ON public.analyses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
