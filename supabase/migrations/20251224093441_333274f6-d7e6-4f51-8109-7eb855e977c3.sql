-- Add readiness status and validation fields to ideas
ALTER TABLE public.ideas 
ADD COLUMN IF NOT EXISTS readiness_status TEXT DEFAULT 'draft' CHECK (readiness_status IN ('draft', 'ready', 'published')),
ADD COLUMN IF NOT EXISTS validation_evidence JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS has_user_interviews BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS has_problem_validation BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS competitive_analysis_summary TEXT;

-- Add demo day fields to sprints
ALTER TABLE public.sprints
ADD COLUMN IF NOT EXISTS demo_video_url TEXT,
ADD COLUMN IF NOT EXISTS demo_notes TEXT,
ADD COLUMN IF NOT EXISTS pitch_deck_url TEXT,
ADD COLUMN IF NOT EXISTS demo_visibility TEXT DEFAULT 'private' CHECK (demo_visibility IN ('private', 'public')),
ADD COLUMN IF NOT EXISTS inactivity_warning_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS failed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- Add founder commitment fields to sprint_members
ALTER TABLE public.sprint_members
ADD COLUMN IF NOT EXISTS is_founder BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS commitment_deposit DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS min_weekly_hours INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS dropout_penalty_applied BOOLEAN DEFAULT FALSE;

-- Add peer rating fields
ALTER TABLE public.sprint_members
ADD COLUMN IF NOT EXISTS peer_rating DECIMAL(3,2) CHECK (peer_rating >= 0 AND peer_rating <= 5),
ADD COLUMN IF NOT EXISTS peer_reviews_received INTEGER DEFAULT 0;

-- Create sprint timeline/activity log table
CREATE TABLE IF NOT EXISTS public.sprint_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sprint_id UUID NOT NULL REFERENCES public.sprints(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create peer reviews table
CREATE TABLE IF NOT EXISTS public.peer_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sprint_id UUID NOT NULL REFERENCES public.sprints(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(sprint_id, reviewer_id, reviewee_id)
);

-- Create demo day requests table
CREATE TABLE IF NOT EXISTS public.demo_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sprint_id UUID NOT NULL REFERENCES public.sprints(id) ON DELETE CASCADE,
  backer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL CHECK (request_type IN ('next_sprint', 'funding', 'meeting')),
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE public.sprint_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.peer_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demo_requests ENABLE ROW LEVEL SECURITY;

-- Sprint timeline policies
CREATE POLICY "Timeline viewable by sprint members"
  ON public.sprint_timeline FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sprint_members 
      WHERE sprint_members.sprint_id = sprint_timeline.sprint_id 
      AND sprint_members.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.sprints s
      JOIN public.ideas i ON i.id = s.idea_id
      WHERE s.id = sprint_id AND i.founder_id = auth.uid()
    )
  );

CREATE POLICY "Sprint members can create timeline events"
  ON public.sprint_timeline FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sprint_members 
      WHERE sprint_members.sprint_id = sprint_id 
      AND sprint_members.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.sprints s
      JOIN public.ideas i ON i.id = s.idea_id
      WHERE s.id = sprint_id AND i.founder_id = auth.uid()
    )
  );

-- Peer reviews policies
CREATE POLICY "Reviews viewable by sprint participants"
  ON public.peer_reviews FOR SELECT
  USING (reviewer_id = auth.uid() OR reviewee_id = auth.uid());

CREATE POLICY "Users can create reviews for sprints they participated in"
  ON public.peer_reviews FOR INSERT
  WITH CHECK (
    auth.uid() = reviewer_id
    AND EXISTS (
      SELECT 1 FROM public.sprint_members 
      WHERE sprint_members.sprint_id = peer_reviews.sprint_id 
      AND sprint_members.user_id = auth.uid()
    )
  );

-- Demo requests policies
CREATE POLICY "Demo requests viewable by backer or founder"
  ON public.demo_requests FOR SELECT
  USING (
    backer_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.sprints s
      JOIN public.ideas i ON i.id = s.idea_id
      WHERE s.id = sprint_id AND i.founder_id = auth.uid()
    )
  );

CREATE POLICY "Backers can create demo requests"
  ON public.demo_requests FOR INSERT
  WITH CHECK (auth.uid() = backer_id);

CREATE POLICY "Founders can update demo requests"
  ON public.demo_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.sprints s
      JOIN public.ideas i ON i.id = s.idea_id
      WHERE s.id = sprint_id AND i.founder_id = auth.uid()
    )
  );

-- Create function to calculate sprint progress
CREATE OR REPLACE FUNCTION public.calculate_sprint_progress(sprint_uuid UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_tasks INTEGER;
  completed_tasks INTEGER;
  progress INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_tasks
  FROM public.tasks
  WHERE sprint_id = sprint_uuid;
  
  SELECT COUNT(*) INTO completed_tasks
  FROM public.tasks
  WHERE sprint_id = sprint_uuid AND status = 'done';
  
  IF total_tasks = 0 THEN
    RETURN 0;
  END IF;
  
  progress := (completed_tasks * 100) / total_tasks;
  
  -- Update sprint progress
  UPDATE public.sprints SET progress = progress WHERE id = sprint_uuid;
  
  RETURN progress;
END;
$$;

-- Create function to calculate execution score
CREATE OR REPLACE FUNCTION public.calculate_execution_score(user_uuid UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_sprints INTEGER;
  completed_sprints INTEGER;
  failed_sprints INTEGER;
  tasks_promised INTEGER;
  tasks_delivered INTEGER;
  avg_peer_rating DECIMAL;
  score INTEGER;
BEGIN
  -- Get sprint stats
  SELECT 
    COUNT(*) FILTER (WHERE s.status IN ('completed', 'failed')),
    COUNT(*) FILTER (WHERE s.status = 'completed'),
    COUNT(*) FILTER (WHERE s.status = 'failed')
  INTO total_sprints, completed_sprints, failed_sprints
  FROM public.sprint_members sm
  JOIN public.sprints s ON s.id = sm.sprint_id
  WHERE sm.user_id = user_uuid AND sm.left_at IS NULL;
  
  -- Get task stats
  SELECT 
    COALESCE(SUM(hours_committed), 0),
    COALESCE(SUM(hours_logged), 0)
  INTO tasks_promised, tasks_delivered
  FROM public.sprint_members
  WHERE user_id = user_uuid;
  
  -- Get average peer rating
  SELECT COALESCE(AVG(rating), 3.0)
  INTO avg_peer_rating
  FROM public.peer_reviews
  WHERE reviewee_id = user_uuid;
  
  -- Calculate score (base 50)
  score := 50;
  
  -- Sprint completion bonus/penalty
  IF total_sprints > 0 THEN
    score := score + ((completed_sprints * 10) - (failed_sprints * 15));
  END IF;
  
  -- Delivery ratio bonus
  IF tasks_promised > 0 THEN
    score := score + ((tasks_delivered::DECIMAL / tasks_promised) * 20)::INTEGER;
  END IF;
  
  -- Peer rating bonus
  score := score + ((avg_peer_rating - 3) * 5)::INTEGER;
  
  -- Clamp between 0 and 100
  score := GREATEST(0, LEAST(100, score));
  
  -- Update profile
  UPDATE public.profiles SET execution_score = score WHERE id = user_uuid;
  
  RETURN score;
END;
$$;

-- Create function to check sprint inactivity
CREATE OR REPLACE FUNCTION public.check_sprint_inactivity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  days_inactive INTEGER;
  warning_threshold INTEGER := 3;
  fail_threshold INTEGER := 7;
BEGIN
  -- Calculate days since last activity
  days_inactive := EXTRACT(DAY FROM NOW() - NEW.last_activity_at);
  
  -- Set warning if inactive for warning_threshold days
  IF days_inactive >= warning_threshold AND NEW.inactivity_warning_at IS NULL AND NEW.status = 'active' THEN
    NEW.inactivity_warning_at := NOW();
    
    -- Log timeline event
    INSERT INTO public.sprint_timeline (sprint_id, event_type, event_data)
    VALUES (NEW.id, 'inactivity_warning', jsonb_build_object('days_inactive', days_inactive));
  END IF;
  
  -- Auto-fail if inactive for fail_threshold days
  IF days_inactive >= fail_threshold AND NEW.status = 'active' THEN
    NEW.status := 'failed';
    NEW.failed_at := NOW();
    
    -- Log timeline event
    INSERT INTO public.sprint_timeline (sprint_id, event_type, event_data)
    VALUES (NEW.id, 'auto_failed', jsonb_build_object('reason', 'inactivity', 'days_inactive', days_inactive));
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create function to handle sprint state changes
CREATE OR REPLACE FUNCTION public.log_sprint_state_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.sprint_timeline (sprint_id, event_type, event_data)
    VALUES (
      NEW.id, 
      'status_change', 
      jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status)
    );
    
    -- Handle completion
    IF NEW.status = 'completed' THEN
      NEW.completed_at := NOW();
      NEW.progress := 100;
    END IF;
    
    -- Handle failure
    IF NEW.status = 'failed' THEN
      NEW.failed_at := NOW();
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create triggers
CREATE TRIGGER on_sprint_state_change
  BEFORE UPDATE ON public.sprints
  FOR EACH ROW
  EXECUTE FUNCTION public.log_sprint_state_change();

-- Create function to calculate equity distribution
CREATE OR REPLACE FUNCTION public.calculate_equity_distribution(sprint_uuid UUID)
RETURNS TABLE(user_id UUID, equity_share DECIMAL)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_contribution DECIMAL;
BEGIN
  -- Calculate total contribution points
  SELECT COALESCE(SUM(
    (hours_logged * 1.0) + 
    (CASE WHEN is_founder THEN 20 ELSE 0 END) +
    (commitment_deposit / 10000.0)
  ), 0)
  INTO total_contribution
  FROM public.sprint_members
  WHERE sprint_members.sprint_id = sprint_uuid AND left_at IS NULL;
  
  IF total_contribution = 0 THEN
    RETURN;
  END IF;
  
  -- Return equity shares
  RETURN QUERY
  SELECT 
    sm.user_id,
    ROUND(
      ((sm.hours_logged * 1.0) + 
       (CASE WHEN sm.is_founder THEN 20 ELSE 0 END) +
       (sm.commitment_deposit / 10000.0)) / total_contribution * 100,
      2
    )::DECIMAL as equity_share
  FROM public.sprint_members sm
  WHERE sm.sprint_id = sprint_uuid AND sm.left_at IS NULL;
END;
$$;

-- Create function to handle member exit and equity adjustment
CREATE OR REPLACE FUNCTION public.handle_member_exit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  member_equity DECIMAL;
BEGIN
  IF NEW.left_at IS NOT NULL AND OLD.left_at IS NULL THEN
    member_equity := OLD.equity_share;
    
    -- Log exit event
    INSERT INTO public.sprint_timeline (sprint_id, user_id, event_type, event_data)
    VALUES (
      NEW.sprint_id,
      NEW.user_id,
      'member_exit',
      jsonb_build_object('role', NEW.role, 'equity_forfeited', member_equity)
    );
    
    -- If founder exits, fail the sprint
    IF OLD.is_founder THEN
      UPDATE public.sprints 
      SET status = 'failed', failed_at = NOW()
      WHERE id = NEW.sprint_id;
      
      -- Apply reputation penalty
      UPDATE public.profiles
      SET execution_score = GREATEST(0, execution_score - 15)
      WHERE id = NEW.user_id;
      
      NEW.dropout_penalty_applied := TRUE;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_member_exit
  BEFORE UPDATE ON public.sprint_members
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_member_exit();

-- Create function to handle commitment status changes
CREATE OR REPLACE FUNCTION public.handle_commitment_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sprint_status TEXT;
BEGIN
  -- Get current sprint status
  SELECT status INTO sprint_status
  FROM public.sprints
  WHERE id = NEW.sprint_id;
  
  -- Auto-release on sprint completion
  IF sprint_status = 'completed' AND OLD.status = 'locked' THEN
    NEW.status := 'released';
  END IF;
  
  -- Auto-refund on sprint failure
  IF sprint_status = 'failed' AND OLD.status IN ('pending', 'locked') THEN
    NEW.status := 'refunded';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_commitment_status_change
  BEFORE UPDATE ON public.commitments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_commitment_status_change();