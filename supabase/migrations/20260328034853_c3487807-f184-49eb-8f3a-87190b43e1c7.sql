
CREATE TABLE public.sprint_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sprint_id uuid NOT NULL REFERENCES public.sprints(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  message_text text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.sprint_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sprint members can view messages"
ON public.sprint_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.sprint_members
    WHERE sprint_members.sprint_id = sprint_messages.sprint_id
      AND sprint_members.user_id = auth.uid()
      AND sprint_members.left_at IS NULL
  )
  OR EXISTS (
    SELECT 1 FROM public.sprints s
    JOIN public.ideas i ON i.id = s.idea_id
    WHERE s.id = sprint_messages.sprint_id
      AND i.founder_id = auth.uid()
  )
);

CREATE POLICY "Sprint members can send messages"
ON public.sprint_messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
  AND (
    EXISTS (
      SELECT 1 FROM public.sprint_members
      WHERE sprint_members.sprint_id = sprint_messages.sprint_id
        AND sprint_members.user_id = auth.uid()
        AND sprint_members.left_at IS NULL
    )
    OR EXISTS (
      SELECT 1 FROM public.sprints s
      JOIN public.ideas i ON i.id = s.idea_id
      WHERE s.id = sprint_messages.sprint_id
        AND i.founder_id = auth.uid()
    )
  )
);

ALTER PUBLICATION supabase_realtime ADD TABLE public.sprint_messages;
