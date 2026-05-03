
-- =============== DEPARTMENTS ===============
CREATE TABLE public.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sprint_id uuid NOT NULL,
  name text NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (sprint_id, name)
);
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.department_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id uuid NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  sprint_id uuid NOT NULL,
  user_id uuid NOT NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (department_id, user_id)
);
ALTER TABLE public.department_members ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.department_access_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id uuid NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  sprint_id uuid NOT NULL,
  user_id uuid NOT NULL,
  message text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz
);
ALTER TABLE public.department_access_requests ENABLE ROW LEVEL SECURITY;

-- Helper: is sprint founder?
CREATE OR REPLACE FUNCTION public.is_sprint_founder(_sprint_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM sprints s JOIN ideas i ON i.id = s.idea_id
    WHERE s.id = _sprint_id AND i.founder_id = _user_id
  )
$$;

-- Helper: is department member?
CREATE OR REPLACE FUNCTION public.is_department_member(_dept_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM department_members WHERE department_id = _dept_id AND user_id = _user_id
  )
$$;

-- RLS for departments
CREATE POLICY "Departments viewable by sprint members or founder"
  ON public.departments FOR SELECT USING (
    public.is_sprint_founder(sprint_id, auth.uid())
    OR EXISTS (SELECT 1 FROM sprint_members sm WHERE sm.sprint_id = departments.sprint_id AND sm.user_id = auth.uid())
  );
CREATE POLICY "Founders can create departments"
  ON public.departments FOR INSERT WITH CHECK (public.is_sprint_founder(sprint_id, auth.uid()));
CREATE POLICY "Founders can update departments"
  ON public.departments FOR UPDATE USING (public.is_sprint_founder(sprint_id, auth.uid()));
CREATE POLICY "Founders can delete departments"
  ON public.departments FOR DELETE USING (public.is_sprint_founder(sprint_id, auth.uid()) AND is_default = false);

-- RLS for department_members
CREATE POLICY "Department membership viewable"
  ON public.department_members FOR SELECT USING (
    user_id = auth.uid() OR public.is_sprint_founder(sprint_id, auth.uid())
  );
CREATE POLICY "Founders or self can add membership"
  ON public.department_members FOR INSERT WITH CHECK (
    public.is_sprint_founder(sprint_id, auth.uid()) OR user_id = auth.uid()
  );
CREATE POLICY "Founders can remove membership"
  ON public.department_members FOR DELETE USING (public.is_sprint_founder(sprint_id, auth.uid()));

-- RLS for access requests
CREATE POLICY "Requests viewable by requester or founder"
  ON public.department_access_requests FOR SELECT USING (
    user_id = auth.uid() OR public.is_sprint_founder(sprint_id, auth.uid())
  );
CREATE POLICY "Users can create access requests"
  ON public.department_access_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Founders can update access requests"
  ON public.department_access_requests FOR UPDATE USING (public.is_sprint_founder(sprint_id, auth.uid()));

-- =============== ADD department_id to scoped tables ===============
ALTER TABLE public.tasks ADD COLUMN department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL;
ALTER TABLE public.sprint_messages ADD COLUMN department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL;
ALTER TABLE public.sprint_commits ADD COLUMN department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL;
ALTER TABLE public.sprint_timeline ADD COLUMN department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL;
ALTER TABLE public.ai_chat_messages ADD COLUMN department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL;
ALTER TABLE public.ai_chat_messages ADD COLUMN tool_type text DEFAULT 'mentor';
ALTER TABLE public.sprint_applications ADD COLUMN department text;

-- =============== Seed default departments ===============
CREATE OR REPLACE FUNCTION public.seed_default_departments(_sprint_id uuid, _founder_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  dept_names text[] := ARRAY['Development','Marketing','Design','Product','Sales','Customer Support','Operations','Finance'];
  dept_name text;
  new_dept_id uuid;
BEGIN
  FOREACH dept_name IN ARRAY dept_names LOOP
    INSERT INTO public.departments (sprint_id, name, is_default, created_by)
    VALUES (_sprint_id, dept_name, true, _founder_id)
    ON CONFLICT (sprint_id, name) DO NOTHING
    RETURNING id INTO new_dept_id;
    IF new_dept_id IS NOT NULL AND _founder_id IS NOT NULL THEN
      INSERT INTO public.department_members (department_id, sprint_id, user_id)
      VALUES (new_dept_id, _sprint_id, _founder_id)
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END;
$$;

-- Trigger: on sprint insert, seed departments
CREATE OR REPLACE FUNCTION public.on_sprint_created_seed_depts()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  founder uuid;
BEGIN
  SELECT founder_id INTO founder FROM ideas WHERE id = NEW.idea_id;
  PERFORM public.seed_default_departments(NEW.id, founder);
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_sprint_seed_depts
  AFTER INSERT ON public.sprints
  FOR EACH ROW EXECUTE FUNCTION public.on_sprint_created_seed_depts();

-- Backfill existing sprints
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT s.id AS sprint_id, i.founder_id FROM sprints s JOIN ideas i ON i.id = s.idea_id LOOP
    PERFORM public.seed_default_departments(r.sprint_id, r.founder_id);
    -- Add existing sprint_members to all default departments so legacy access keeps working
    INSERT INTO public.department_members (department_id, sprint_id, user_id)
    SELECT d.id, d.sprint_id, sm.user_id
    FROM departments d
    JOIN sprint_members sm ON sm.sprint_id = d.sprint_id AND sm.left_at IS NULL
    WHERE d.sprint_id = r.sprint_id AND d.is_default = true
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- =============== Delete startup function ===============
CREATE OR REPLACE FUNCTION public.delete_idea_cascade(_idea_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  is_owner boolean;
BEGIN
  SELECT EXISTS (SELECT 1 FROM ideas WHERE id = _idea_id AND founder_id = auth.uid()) INTO is_owner;
  IF NOT is_owner THEN RAISE EXCEPTION 'Not authorized'; END IF;

  DELETE FROM department_access_requests WHERE sprint_id IN (SELECT id FROM sprints WHERE idea_id = _idea_id);
  DELETE FROM department_members WHERE sprint_id IN (SELECT id FROM sprints WHERE idea_id = _idea_id);
  DELETE FROM departments WHERE sprint_id IN (SELECT id FROM sprints WHERE idea_id = _idea_id);
  DELETE FROM tasks WHERE sprint_id IN (SELECT id FROM sprints WHERE idea_id = _idea_id);
  DELETE FROM sprint_messages WHERE sprint_id IN (SELECT id FROM sprints WHERE idea_id = _idea_id);
  DELETE FROM sprint_commits WHERE sprint_id IN (SELECT id FROM sprints WHERE idea_id = _idea_id);
  DELETE FROM code_commits WHERE sprint_id IN (SELECT id FROM sprints WHERE idea_id = _idea_id);
  DELETE FROM sprint_timeline WHERE sprint_id IN (SELECT id FROM sprints WHERE idea_id = _idea_id);
  DELETE FROM ai_chat_messages WHERE sprint_id IN (SELECT id FROM sprints WHERE idea_id = _idea_id);
  DELETE FROM sprint_applications WHERE sprint_id IN (SELECT id FROM sprints WHERE idea_id = _idea_id);
  DELETE FROM sprint_members WHERE sprint_id IN (SELECT id FROM sprints WHERE idea_id = _idea_id);
  DELETE FROM sprint_questions WHERE sprint_id IN (SELECT id FROM sprints WHERE idea_id = _idea_id);
  DELETE FROM sprint_plans WHERE sprint_id IN (SELECT id FROM sprints WHERE idea_id = _idea_id);
  DELETE FROM peer_reviews WHERE sprint_id IN (SELECT id FROM sprints WHERE idea_id = _idea_id);
  DELETE FROM commitments WHERE sprint_id IN (SELECT id FROM sprints WHERE idea_id = _idea_id);
  DELETE FROM demo_requests WHERE sprint_id IN (SELECT id FROM sprints WHERE idea_id = _idea_id);
  DELETE FROM funding_requests WHERE sprint_id IN (SELECT id FROM sprints WHERE idea_id = _idea_id);
  DELETE FROM branding_partnerships WHERE sprint_id IN (SELECT id FROM sprints WHERE idea_id = _idea_id);
  DELETE FROM sprints WHERE idea_id = _idea_id;
  DELETE FROM ideas WHERE id = _idea_id;
END;
$$;

-- =============== Update RLS on scoped tables to enforce dept access ===============
-- Tasks: replace SELECT to filter by dept membership
DROP POLICY IF EXISTS "Tasks viewable by sprint members" ON public.tasks;
CREATE POLICY "Tasks viewable by dept members or founder"
  ON public.tasks FOR SELECT USING (
    public.is_sprint_founder(sprint_id, auth.uid())
    OR department_id IS NULL AND EXISTS (SELECT 1 FROM sprint_members sm WHERE sm.sprint_id = tasks.sprint_id AND sm.user_id = auth.uid())
    OR (department_id IS NOT NULL AND public.is_department_member(department_id, auth.uid()))
  );

DROP POLICY IF EXISTS "Sprint messages viewable" ON public.sprint_messages;
DROP POLICY IF EXISTS "Sprint members can view messages" ON public.sprint_messages;
CREATE POLICY "Messages viewable by dept members or founder"
  ON public.sprint_messages FOR SELECT USING (
    public.is_sprint_founder(sprint_id, auth.uid())
    OR (department_id IS NULL AND EXISTS (SELECT 1 FROM sprint_members sm WHERE sm.sprint_id = sprint_messages.sprint_id AND sm.user_id = auth.uid()))
    OR (department_id IS NOT NULL AND public.is_department_member(department_id, auth.uid()))
  );

DROP POLICY IF EXISTS "Sprint members can view commits" ON public.sprint_commits;
CREATE POLICY "Files viewable by dept members or founder"
  ON public.sprint_commits FOR SELECT USING (
    public.is_sprint_founder(sprint_id, auth.uid())
    OR (department_id IS NULL AND EXISTS (SELECT 1 FROM sprint_members sm WHERE sm.sprint_id = sprint_commits.sprint_id AND sm.user_id = auth.uid()))
    OR (department_id IS NOT NULL AND public.is_department_member(department_id, auth.uid()))
  );

DROP POLICY IF EXISTS "Timeline viewable by sprint members" ON public.sprint_timeline;
CREATE POLICY "Timeline viewable by dept members or founder"
  ON public.sprint_timeline FOR SELECT USING (
    public.is_sprint_founder(sprint_id, auth.uid())
    OR (department_id IS NULL AND EXISTS (SELECT 1 FROM sprint_members sm WHERE sm.sprint_id = sprint_timeline.sprint_id AND sm.user_id = auth.uid()))
    OR (department_id IS NOT NULL AND public.is_department_member(department_id, auth.uid()))
  );
