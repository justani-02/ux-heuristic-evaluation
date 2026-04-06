
-- Add user_id column to analyses table
ALTER TABLE public.analyses ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id column to tasks table (inherits from analysis, but useful for direct queries)
ALTER TABLE public.tasks ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop existing permissive policies on analyses
DROP POLICY IF EXISTS "Anyone can create analyses" ON public.analyses;
DROP POLICY IF EXISTS "Anyone can update analyses" ON public.analyses;
DROP POLICY IF EXISTS "Anyone can view analyses" ON public.analyses;

-- New RLS policies for analyses (per-user)
CREATE POLICY "Users can view own analyses"
  ON public.analyses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analyses"
  ON public.analyses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own analyses"
  ON public.analyses FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own analyses"
  ON public.analyses FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Drop existing permissive policies on tasks
DROP POLICY IF EXISTS "Anyone can create tasks" ON public.tasks;
DROP POLICY IF EXISTS "Anyone can update tasks" ON public.tasks;
DROP POLICY IF EXISTS "Anyone can view tasks" ON public.tasks;
DROP POLICY IF EXISTS "Anyone can delete tasks" ON public.tasks;

-- New RLS policies for tasks (per-user)
CREATE POLICY "Users can view own tasks"
  ON public.tasks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks"
  ON public.tasks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks"
  ON public.tasks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks"
  ON public.tasks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
