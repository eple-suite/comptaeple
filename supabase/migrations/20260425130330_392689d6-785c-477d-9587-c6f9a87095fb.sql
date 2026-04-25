
-- Conversations table
CREATE TABLE public.assistant_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'Nouvelle conversation',
  archived BOOLEAN NOT NULL DEFAULT false,
  context_module TEXT,
  context_establishment_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_assistant_conv_user ON public.assistant_conversations(user_id, updated_at DESC);

ALTER TABLE public.assistant_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own conversations"
ON public.assistant_conversations FOR SELECT
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users create own conversations"
ON public.assistant_conversations FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own conversations"
ON public.assistant_conversations FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users delete own conversations"
ON public.assistant_conversations FOR DELETE
USING (auth.uid() = user_id);

CREATE TRIGGER update_assistant_conv_updated_at
BEFORE UPDATE ON public.assistant_conversations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Messages table
CREATE TABLE public.assistant_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.assistant_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  sources JSONB,
  attachment_name TEXT,
  attachment_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_assistant_msg_conv ON public.assistant_messages(conversation_id, created_at);

ALTER TABLE public.assistant_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own messages"
ON public.assistant_messages FOR SELECT
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users create own messages"
ON public.assistant_messages FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own messages"
ON public.assistant_messages FOR DELETE
USING (auth.uid() = user_id);
