
-- Create AI chat messages table for mentor history
CREATE TABLE public.ai_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sprint_id UUID NOT NULL REFERENCES public.sprints(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  content TEXT NOT NULL,
  context_metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_chat_messages ENABLE ROW LEVEL SECURITY;

-- Users can view their own chat messages for sprints they belong to
CREATE POLICY "Users can view own AI chat messages"
ON public.ai_chat_messages
FOR SELECT
USING (
  user_id = auth.uid()
  AND (
    EXISTS (SELECT 1 FROM sprint_members WHERE sprint_members.sprint_id = ai_chat_messages.sprint_id AND sprint_members.user_id = auth.uid() AND sprint_members.left_at IS NULL)
    OR EXISTS (SELECT 1 FROM sprints s JOIN ideas i ON i.id = s.idea_id WHERE s.id = ai_chat_messages.sprint_id AND i.founder_id = auth.uid())
  )
);

-- Users can insert their own chat messages
CREATE POLICY "Users can insert own AI chat messages"
ON public.ai_chat_messages
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND (
    EXISTS (SELECT 1 FROM sprint_members WHERE sprint_members.sprint_id = ai_chat_messages.sprint_id AND sprint_members.user_id = auth.uid() AND sprint_members.left_at IS NULL)
    OR EXISTS (SELECT 1 FROM sprints s JOIN ideas i ON i.id = s.idea_id WHERE s.id = ai_chat_messages.sprint_id AND i.founder_id = auth.uid())
  )
);

-- Create index for fast retrieval
CREATE INDEX idx_ai_chat_messages_sprint_user ON public.ai_chat_messages(sprint_id, user_id, created_at);

-- Enable realtime on key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sprint_timeline;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sprint_members;
