-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('founder', 'builder', 'backer');

-- Create enum for sprint status
CREATE TYPE public.sprint_status AS ENUM ('draft', 'active', 'paused', 'completed', 'failed');

-- Create enum for idea stage
CREATE TYPE public.idea_stage AS ENUM ('idea', 'validation', 'prototype', 'mvp');

-- Create enum for task status
CREATE TYPE public.task_status AS ENUM ('todo', 'in_progress', 'done');

-- Create enum for commitment status
CREATE TYPE public.commitment_status AS ENUM ('pending', 'locked', 'released', 'refunded');

-- Create enum for application status
CREATE TYPE public.application_status AS ENUM ('pending', 'accepted', 'rejected', 'withdrawn');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  location TEXT,
  linkedin_url TEXT,
  github_url TEXT,
  portfolio_url TEXT,
  skills TEXT[],
  availability_hours INTEGER DEFAULT 10,
  execution_score INTEGER DEFAULT 50 CHECK (execution_score >= 0 AND execution_score <= 100),
  sprints_completed INTEGER DEFAULT 0,
  tasks_completed INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Create ideas table
CREATE TABLE public.ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  pitch TEXT NOT NULL,
  problem_statement TEXT,
  target_users TEXT,
  industry TEXT[],
  stage idea_stage DEFAULT 'idea',
  required_roles TEXT[],
  sprint_duration INTEGER DEFAULT 14 CHECK (sprint_duration IN (14, 21, 30)),
  weekly_commitment INTEGER DEFAULT 10,
  is_published BOOLEAN DEFAULT FALSE,
  validation_proof TEXT,
  competitive_analysis TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sprints table
CREATE TABLE public.sprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  goal TEXT,
  deliverables TEXT[],
  status sprint_status DEFAULT 'draft',
  duration_days INTEGER NOT NULL CHECK (duration_days IN (14, 21, 30)),
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  team_formed BOOLEAN DEFAULT FALSE,
  goals_defined BOOLEAN DEFAULT FALSE,
  tasks_assigned BOOLEAN DEFAULT FALSE,
  mid_review_done BOOLEAN DEFAULT FALSE,
  deliverables_submitted BOOLEAN DEFAULT FALSE,
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sprint_members table
CREATE TABLE public.sprint_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sprint_id UUID NOT NULL REFERENCES public.sprints(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  hours_committed INTEGER DEFAULT 0,
  hours_logged INTEGER DEFAULT 0,
  equity_share DECIMAL(5,2) DEFAULT 0,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  left_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(sprint_id, user_id)
);

-- Create sprint_applications table
CREATE TABLE public.sprint_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sprint_id UUID NOT NULL REFERENCES public.sprints(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  message TEXT,
  availability_hours INTEGER,
  status application_status DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(sprint_id, user_id)
);

-- Create tasks table
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sprint_id UUID NOT NULL REFERENCES public.sprints(id) ON DELETE CASCADE,
  assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status task_status DEFAULT 'todo',
  priority INTEGER DEFAULT 1 CHECK (priority >= 1 AND priority <= 5),
  hours_estimated INTEGER,
  hours_logged INTEGER DEFAULT 0,
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create commitments table (for backers)
CREATE TABLE public.commitments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  backer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sprint_id UUID NOT NULL REFERENCES public.sprints(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  unlock_milestone TEXT,
  status commitment_status DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to get user's primary role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Create trigger for profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$;

-- Create triggers
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER on_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_ideas_updated
  BEFORE UPDATE ON public.ideas
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_sprints_updated
  BEFORE UPDATE ON public.sprints
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_tasks_updated
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sprint_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sprint_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commitments ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- User roles policies
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own role"
  ON public.user_roles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Ideas policies
CREATE POLICY "Published ideas are viewable by everyone"
  ON public.ideas FOR SELECT
  USING (is_published = true OR founder_id = auth.uid());

CREATE POLICY "Founders can create ideas"
  ON public.ideas FOR INSERT
  WITH CHECK (auth.uid() = founder_id);

CREATE POLICY "Founders can update own ideas"
  ON public.ideas FOR UPDATE
  USING (auth.uid() = founder_id);

CREATE POLICY "Founders can delete own ideas"
  ON public.ideas FOR DELETE
  USING (auth.uid() = founder_id);

-- Sprints policies
CREATE POLICY "Sprints viewable by members or if idea is published"
  ON public.sprints FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.ideas 
      WHERE ideas.id = sprints.idea_id 
      AND (ideas.is_published = true OR ideas.founder_id = auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM public.sprint_members 
      WHERE sprint_members.sprint_id = sprints.id 
      AND sprint_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Idea founders can create sprints"
  ON public.sprints FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ideas 
      WHERE ideas.id = idea_id 
      AND ideas.founder_id = auth.uid()
    )
  );

CREATE POLICY "Idea founders can update sprints"
  ON public.sprints FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.ideas 
      WHERE ideas.id = idea_id 
      AND ideas.founder_id = auth.uid()
    )
  );

-- Sprint members policies
CREATE POLICY "Sprint members viewable by authenticated users"
  ON public.sprint_members FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Founders can add members"
  ON public.sprint_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sprints s
      JOIN public.ideas i ON i.id = s.idea_id
      WHERE s.id = sprint_id AND i.founder_id = auth.uid()
    )
    OR user_id = auth.uid()
  );

CREATE POLICY "Members can update own membership"
  ON public.sprint_members FOR UPDATE
  USING (user_id = auth.uid());

-- Sprint applications policies
CREATE POLICY "Applications viewable by applicant or founder"
  ON public.sprint_applications FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.sprints s
      JOIN public.ideas i ON i.id = s.idea_id
      WHERE s.id = sprint_id AND i.founder_id = auth.uid()
    )
  );

CREATE POLICY "Users can create applications"
  ON public.sprint_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Founders can update applications"
  ON public.sprint_applications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.sprints s
      JOIN public.ideas i ON i.id = s.idea_id
      WHERE s.id = sprint_id AND i.founder_id = auth.uid()
    )
    OR user_id = auth.uid()
  );

-- Tasks policies
CREATE POLICY "Tasks viewable by sprint members"
  ON public.tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sprint_members 
      WHERE sprint_members.sprint_id = tasks.sprint_id 
      AND sprint_members.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.sprints s
      JOIN public.ideas i ON i.id = s.idea_id
      WHERE s.id = sprint_id AND i.founder_id = auth.uid()
    )
  );

CREATE POLICY "Sprint members can create tasks"
  ON public.tasks FOR INSERT
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

CREATE POLICY "Sprint members can update tasks"
  ON public.tasks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.sprint_members 
      WHERE sprint_members.sprint_id = tasks.sprint_id 
      AND sprint_members.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.sprints s
      JOIN public.ideas i ON i.id = s.idea_id
      WHERE s.id = sprint_id AND i.founder_id = auth.uid()
    )
  );

-- Commitments policies
CREATE POLICY "Commitments viewable by backer or founder"
  ON public.commitments FOR SELECT
  USING (
    backer_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.sprints s
      JOIN public.ideas i ON i.id = s.idea_id
      WHERE s.id = sprint_id AND i.founder_id = auth.uid()
    )
  );

CREATE POLICY "Backers can create commitments"
  ON public.commitments FOR INSERT
  WITH CHECK (auth.uid() = backer_id);

CREATE POLICY "Backers can update own commitments"
  ON public.commitments FOR UPDATE
  USING (backer_id = auth.uid());