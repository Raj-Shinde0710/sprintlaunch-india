
-- Add new columns to sprint_applications
ALTER TABLE public.sprint_applications 
ADD COLUMN IF NOT EXISTS resume_url text,
ADD COLUMN IF NOT EXISTS portfolio_links text[],
ADD COLUMN IF NOT EXISTS answers jsonb DEFAULT '{}'::jsonb;

-- Create sprint_questions table
CREATE TABLE IF NOT EXISTS public.sprint_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sprint_id uuid NOT NULL REFERENCES public.sprints(id) ON DELETE CASCADE,
  question text NOT NULL,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.sprint_questions ENABLE ROW LEVEL SECURITY;

-- Founders can manage questions for their sprints
CREATE POLICY "Founders can manage sprint questions" ON public.sprint_questions
FOR ALL TO public
USING (EXISTS (
  SELECT 1 FROM sprints s JOIN ideas i ON i.id = s.idea_id
  WHERE s.id = sprint_questions.sprint_id AND i.founder_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM sprints s JOIN ideas i ON i.id = s.idea_id
  WHERE s.id = sprint_questions.sprint_id AND i.founder_id = auth.uid()
));

-- Anyone can view questions for published ideas
CREATE POLICY "Questions viewable for published ideas" ON public.sprint_questions
FOR SELECT TO public
USING (EXISTS (
  SELECT 1 FROM sprints s JOIN ideas i ON i.id = s.idea_id
  WHERE s.id = sprint_questions.sprint_id AND i.is_published = true
));

-- Create storage bucket for resumes
INSERT INTO storage.buckets (id, name, public) VALUES ('resumes', 'resumes', false)
ON CONFLICT (id) DO NOTHING;

-- RLS for resumes bucket: users can upload their own
CREATE POLICY "Users can upload resumes" ON storage.objects
FOR INSERT TO public
WITH CHECK (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Users can read their own resumes
CREATE POLICY "Users can read own resumes" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Founders can read applicant resumes
CREATE POLICY "Founders can read applicant resumes" ON storage.objects
FOR SELECT TO public
USING (
  bucket_id = 'resumes' AND
  EXISTS (
    SELECT 1 FROM sprint_applications sa
    JOIN sprints s ON s.id = sa.sprint_id
    JOIN ideas i ON i.id = s.idea_id
    WHERE i.founder_id = auth.uid()
    AND sa.resume_url LIKE '%' || storage.filename(name) || '%'
  )
);
