
-- 1. Restrict profiles.email column access (only owner can read it)
REVOKE SELECT (email) ON public.profiles FROM anon, authenticated;
GRANT SELECT (email) ON public.profiles TO postgres, service_role;
-- Allow owner to read their own email via a view-like pattern: keep RLS but rely on column GRANT.
-- Owner reads their own profile already; to let them read their own email we grant it to authenticated
-- but enforce row scope through RLS. Simpler: provide a SECURITY DEFINER function for owner email.
CREATE OR REPLACE FUNCTION public.get_my_email()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT email FROM public.profiles WHERE id = auth.uid();
$$;

-- 2. Fix tasks INSERT policy bug
DROP POLICY IF EXISTS "Sprint members can create tasks" ON public.tasks;
CREATE POLICY "Sprint members can create tasks" ON public.tasks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sprint_members sm
      WHERE sm.sprint_id = tasks.sprint_id AND sm.user_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM public.sprints s
      JOIN public.ideas i ON i.id = s.idea_id
      WHERE s.id = tasks.sprint_id AND i.founder_id = auth.uid()
    )
  );

-- 3. Fix sprint_timeline INSERT policy bug
DROP POLICY IF EXISTS "Sprint members can create timeline events" ON public.sprint_timeline;
CREATE POLICY "Sprint members can create timeline events" ON public.sprint_timeline
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sprint_members sm
      WHERE sm.sprint_id = sprint_timeline.sprint_id AND sm.user_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM public.sprints s
      JOIN public.ideas i ON i.id = s.idea_id
      WHERE s.id = sprint_timeline.sprint_id AND i.founder_id = auth.uid()
    )
  );

-- 4. Prevent members from changing their own equity_share / is_founder / commitment_deposit
CREATE OR REPLACE FUNCTION public.protect_sprint_member_fields()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  is_founder_caller boolean;
BEGIN
  SELECT public.is_sprint_founder(NEW.sprint_id, auth.uid()) INTO is_founder_caller;
  IF NOT is_founder_caller THEN
    IF NEW.equity_share IS DISTINCT FROM OLD.equity_share THEN
      RAISE EXCEPTION 'Only the sprint founder can modify equity_share';
    END IF;
    IF NEW.is_founder IS DISTINCT FROM OLD.is_founder THEN
      RAISE EXCEPTION 'is_founder cannot be self-modified';
    END IF;
    IF NEW.commitment_deposit IS DISTINCT FROM OLD.commitment_deposit THEN
      RAISE EXCEPTION 'commitment_deposit cannot be self-modified';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_sprint_member_fields_trg ON public.sprint_members;
CREATE TRIGGER protect_sprint_member_fields_trg
BEFORE UPDATE ON public.sprint_members
FOR EACH ROW EXECUTE FUNCTION public.protect_sprint_member_fields();

-- 5. Add auth check to calculate_execution_score
CREATE OR REPLACE FUNCTION public.calculate_execution_score(user_uuid uuid)
 RETURNS integer
 LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
DECLARE
  total_sprints INTEGER;
  completed_sprints INTEGER;
  failed_sprints INTEGER;
  tasks_promised INTEGER;
  tasks_delivered INTEGER;
  avg_peer_rating DECIMAL;
  score INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF auth.uid() <> user_uuid AND NOT EXISTS (
    SELECT 1 FROM public.sprint_members sm
    WHERE sm.user_id = user_uuid AND sm.sprint_id IN (
      SELECT sprint_id FROM public.sprint_members WHERE user_id = auth.uid()
    )
  ) AND NOT EXISTS (
    SELECT 1 FROM public.sprint_members sm
    JOIN public.sprints s ON s.id = sm.sprint_id
    JOIN public.ideas i ON i.id = s.idea_id
    WHERE sm.user_id = user_uuid AND i.founder_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized to calculate this user''s score';
  END IF;

  SELECT
    COUNT(*) FILTER (WHERE s.status IN ('completed', 'failed')),
    COUNT(*) FILTER (WHERE s.status = 'completed'),
    COUNT(*) FILTER (WHERE s.status = 'failed')
  INTO total_sprints, completed_sprints, failed_sprints
  FROM public.sprint_members sm
  JOIN public.sprints s ON s.id = sm.sprint_id
  WHERE sm.user_id = user_uuid AND sm.left_at IS NULL;

  SELECT COALESCE(SUM(hours_committed), 0), COALESCE(SUM(hours_logged), 0)
  INTO tasks_promised, tasks_delivered
  FROM public.sprint_members WHERE user_id = user_uuid;

  SELECT COALESCE(AVG(rating), 3.0) INTO avg_peer_rating
  FROM public.peer_reviews WHERE reviewee_id = user_uuid;

  score := 50;
  IF total_sprints > 0 THEN
    score := score + ((completed_sprints * 10) - (failed_sprints * 15));
  END IF;
  IF tasks_promised > 0 THEN
    score := score + ((tasks_delivered::DECIMAL / tasks_promised) * 20)::INTEGER;
  END IF;
  score := score + ((avg_peer_rating - 3) * 5)::INTEGER;
  score := GREATEST(0, LEAST(100, score));

  UPDATE public.profiles SET execution_score = score WHERE id = user_uuid;
  RETURN score;
END;
$function$;

-- 6. Add auth check to calculate_sprint_progress
CREATE OR REPLACE FUNCTION public.calculate_sprint_progress(sprint_uuid uuid)
 RETURNS integer
 LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
DECLARE
  total_tasks INTEGER;
  completed_tasks INTEGER;
  progress INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.sprint_members WHERE sprint_id = sprint_uuid AND user_id = auth.uid()
  ) AND NOT public.is_sprint_founder(sprint_uuid, auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized for this sprint';
  END IF;

  SELECT COUNT(*) INTO total_tasks FROM public.tasks WHERE sprint_id = sprint_uuid;
  SELECT COUNT(*) INTO completed_tasks FROM public.tasks WHERE sprint_id = sprint_uuid AND status = 'done';

  IF total_tasks = 0 THEN RETURN 0; END IF;
  progress := (completed_tasks * 100) / total_tasks;
  UPDATE public.sprints SET progress = progress WHERE id = sprint_uuid;
  RETURN progress;
END;
$function$;
