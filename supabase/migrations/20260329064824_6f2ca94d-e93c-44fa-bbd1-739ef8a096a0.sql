
-- Create code_commits table for storing code workspace commits
CREATE TABLE public.code_commits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sprint_id uuid NOT NULL REFERENCES public.sprints(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code_content text NOT NULL,
  language text NOT NULL DEFAULT 'javascript',
  commit_message text NOT NULL,
  lines_of_code integer NOT NULL DEFAULT 0,
  file_name text NOT NULL DEFAULT 'main.js',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.code_commits ENABLE ROW LEVEL SECURITY;

-- Sprint members can view code commits
CREATE POLICY "Sprint members can view code commits" ON public.code_commits
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sprint_members
      WHERE sprint_members.sprint_id = code_commits.sprint_id
        AND sprint_members.user_id = auth.uid()
        AND sprint_members.left_at IS NULL
    )
    OR EXISTS (
      SELECT 1 FROM sprints s JOIN ideas i ON i.id = s.idea_id
      WHERE s.id = code_commits.sprint_id AND i.founder_id = auth.uid()
    )
  );

-- Sprint members can insert code commits
CREATE POLICY "Sprint members can insert code commits" ON public.code_commits
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND (
      EXISTS (
        SELECT 1 FROM sprint_members
        WHERE sprint_members.sprint_id = code_commits.sprint_id
          AND sprint_members.user_id = auth.uid()
          AND sprint_members.left_at IS NULL
      )
      OR EXISTS (
        SELECT 1 FROM sprints s JOIN ideas i ON i.id = s.idea_id
        WHERE s.id = code_commits.sprint_id AND i.founder_id = auth.uid()
      )
    )
  );
