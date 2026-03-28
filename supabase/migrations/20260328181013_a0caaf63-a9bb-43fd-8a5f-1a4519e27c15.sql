
-- Create sprint_commits table
CREATE TABLE public.sprint_commits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sprint_id UUID NOT NULL REFERENCES public.sprints(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  commit_message TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sprint_commits ENABLE ROW LEVEL SECURITY;

-- Only sprint members or idea founder can view commits
CREATE POLICY "Sprint members can view commits" ON public.sprint_commits
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sprint_members
      WHERE sprint_members.sprint_id = sprint_commits.sprint_id
        AND sprint_members.user_id = auth.uid()
        AND sprint_members.left_at IS NULL
    )
    OR EXISTS (
      SELECT 1 FROM sprints s JOIN ideas i ON i.id = s.idea_id
      WHERE s.id = sprint_commits.sprint_id AND i.founder_id = auth.uid()
    )
  );

-- Sprint members can insert commits
CREATE POLICY "Sprint members can insert commits" ON public.sprint_commits
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND (
      EXISTS (
        SELECT 1 FROM sprint_members
        WHERE sprint_members.sprint_id = sprint_commits.sprint_id
          AND sprint_members.user_id = auth.uid()
          AND sprint_members.left_at IS NULL
      )
      OR EXISTS (
        SELECT 1 FROM sprints s JOIN ideas i ON i.id = s.idea_id
        WHERE s.id = sprint_commits.sprint_id AND i.founder_id = auth.uid()
      )
    )
  );

-- Create sprint-files storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('sprint-files', 'sprint-files', false);

-- Storage policies for sprint-files bucket
CREATE POLICY "Sprint members can upload files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'sprint-files'
    AND (storage.foldername(name))[1] IN (
      SELECT sm.sprint_id::text FROM sprint_members sm
      WHERE sm.user_id = auth.uid() AND sm.left_at IS NULL
    )
  );

CREATE POLICY "Sprint members can view files" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'sprint-files'
    AND (storage.foldername(name))[1] IN (
      SELECT sm.sprint_id::text FROM sprint_members sm
      WHERE sm.user_id = auth.uid() AND sm.left_at IS NULL
      UNION
      SELECT s.id::text FROM sprints s JOIN ideas i ON i.id = s.idea_id
      WHERE i.founder_id = auth.uid()
    )
  );
