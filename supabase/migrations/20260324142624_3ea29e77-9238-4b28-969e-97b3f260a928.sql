
-- Add created_by to tasks table
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS created_by uuid;

-- Add DELETE policy for tasks (founders can delete)
CREATE POLICY "Founders can delete tasks"
ON public.tasks
FOR DELETE
TO public
USING (
  EXISTS (
    SELECT 1 FROM sprints s
    JOIN ideas i ON i.id = s.idea_id
    WHERE s.id = tasks.sprint_id AND i.founder_id = auth.uid()
  )
);

-- Create sprint_plans table for AI-generated plans
CREATE TABLE IF NOT EXISTS public.sprint_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sprint_id uuid REFERENCES public.sprints(id) ON DELETE CASCADE NOT NULL,
  plan_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  generated_at timestamp with time zone DEFAULT now(),
  status text DEFAULT 'draft',
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.sprint_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sprint plans viewable by sprint members or founder"
ON public.sprint_plans
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM sprints s
    JOIN ideas i ON i.id = s.idea_id
    WHERE s.id = sprint_plans.sprint_id 
    AND (i.founder_id = auth.uid() OR EXISTS (
      SELECT 1 FROM sprint_members sm WHERE sm.sprint_id = s.id AND sm.user_id = auth.uid()
    ))
  )
);

CREATE POLICY "Founders can insert sprint plans"
ON public.sprint_plans
FOR INSERT
TO public
WITH CHECK (
  EXISTS (
    SELECT 1 FROM sprints s
    JOIN ideas i ON i.id = s.idea_id
    WHERE s.id = sprint_plans.sprint_id AND i.founder_id = auth.uid()
  )
);

CREATE POLICY "Founders can update sprint plans"
ON public.sprint_plans
FOR UPDATE
TO public
USING (
  EXISTS (
    SELECT 1 FROM sprints s
    JOIN ideas i ON i.id = s.idea_id
    WHERE s.id = sprint_plans.sprint_id AND i.founder_id = auth.uid()
  )
);
