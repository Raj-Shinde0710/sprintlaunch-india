DROP POLICY IF EXISTS "Departments viewable by sprint members or founder" ON public.departments;

CREATE POLICY "Departments viewable by members, founder, or for published ideas"
ON public.departments
FOR SELECT
USING (
  is_sprint_founder(sprint_id, auth.uid())
  OR EXISTS (
    SELECT 1 FROM sprint_members sm
    WHERE sm.sprint_id = departments.sprint_id AND sm.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM sprints s
    JOIN ideas i ON i.id = s.idea_id
    WHERE s.id = departments.sprint_id AND i.is_published = true
  )
);