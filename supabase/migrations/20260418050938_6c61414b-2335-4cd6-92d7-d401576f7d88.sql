-- Funding requests table
CREATE TABLE public.funding_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sprint_id UUID NOT NULL REFERENCES public.sprints(id) ON DELETE CASCADE,
  investor_id UUID NOT NULL,
  investor_type TEXT NOT NULL CHECK (investor_type IN ('angel', 'branding')),
  investor_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  message TEXT,
  agreement_accepted BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected','completed')),
  platform_fee NUMERIC DEFAULT 0,
  accepted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.funding_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Investors can create funding requests"
ON public.funding_requests FOR INSERT
WITH CHECK (
  auth.uid() = investor_id
  AND agreement_accepted = true
);

CREATE POLICY "Investor or founder can view funding requests"
ON public.funding_requests FOR SELECT
USING (
  investor_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.sprints s
    JOIN public.ideas i ON i.id = s.idea_id
    WHERE s.id = funding_requests.sprint_id
      AND i.founder_id = auth.uid()
  )
);

CREATE POLICY "Founder can update funding requests"
ON public.funding_requests FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.sprints s
    JOIN public.ideas i ON i.id = s.idea_id
    WHERE s.id = funding_requests.sprint_id
      AND i.founder_id = auth.uid()
  )
);

-- Branding partnerships table
CREATE TABLE public.branding_partnerships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  funding_request_id UUID REFERENCES public.funding_requests(id) ON DELETE CASCADE,
  sprint_id UUID NOT NULL REFERENCES public.sprints(id) ON DELETE CASCADE,
  investor_id UUID NOT NULL,
  brand_name TEXT NOT NULL,
  logo_url TEXT,
  website_url TEXT,
  duration_days INTEGER NOT NULL DEFAULT 30,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','expired')),
  approved_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.branding_partnerships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Investors can create branding partnerships"
ON public.branding_partnerships FOR INSERT
WITH CHECK (auth.uid() = investor_id);

CREATE POLICY "Approved branding visible publicly"
ON public.branding_partnerships FOR SELECT
USING (
  status = 'approved'
  OR investor_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.sprints s
    JOIN public.ideas i ON i.id = s.idea_id
    WHERE s.id = branding_partnerships.sprint_id
      AND i.founder_id = auth.uid()
  )
);

CREATE POLICY "Founder can update branding partnerships"
ON public.branding_partnerships FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.sprints s
    JOIN public.ideas i ON i.id = s.idea_id
    WHERE s.id = branding_partnerships.sprint_id
      AND i.founder_id = auth.uid()
  )
);

-- Updated_at triggers
CREATE TRIGGER funding_requests_updated_at
BEFORE UPDATE ON public.funding_requests
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER branding_partnerships_updated_at
BEFORE UPDATE ON public.branding_partnerships
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Auto-set platform fee + timestamps on funding_requests
CREATE OR REPLACE FUNCTION public.handle_funding_request_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.sprint_timeline (sprint_id, user_id, event_type, event_data)
    VALUES (NEW.sprint_id, NEW.investor_id, 'investor_applied',
      jsonb_build_object('amount', NEW.amount, 'investor_name', NEW.investor_name, 'type', NEW.investor_type));
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.status = 'accepted' THEN
      NEW.accepted_at := now();
      INSERT INTO public.sprint_timeline (sprint_id, user_id, event_type, event_data)
      VALUES (NEW.sprint_id, NEW.investor_id, 'funding_accepted',
        jsonb_build_object('amount', NEW.amount, 'investor_name', NEW.investor_name));
    ELSIF NEW.status = 'rejected' THEN
      NEW.rejected_at := now();
      INSERT INTO public.sprint_timeline (sprint_id, user_id, event_type, event_data)
      VALUES (NEW.sprint_id, NEW.investor_id, 'funding_rejected',
        jsonb_build_object('investor_name', NEW.investor_name));
    ELSIF NEW.status = 'completed' THEN
      NEW.completed_at := now();
      NEW.platform_fee := ROUND(NEW.amount * 0.01, 2);
      INSERT INTO public.sprint_timeline (sprint_id, user_id, event_type, event_data)
      VALUES (NEW.sprint_id, NEW.investor_id, 'deal_completed',
        jsonb_build_object('amount', NEW.amount, 'platform_fee', NEW.platform_fee));
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER funding_request_changes
BEFORE INSERT OR UPDATE ON public.funding_requests
FOR EACH ROW EXECUTE FUNCTION public.handle_funding_request_changes();

-- Branding partnership status changes
CREATE OR REPLACE FUNCTION public.handle_branding_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.status = 'approved' THEN
      NEW.approved_at := now();
      NEW.expires_at := now() + (NEW.duration_days || ' days')::interval;
      INSERT INTO public.sprint_timeline (sprint_id, user_id, event_type, event_data)
      VALUES (NEW.sprint_id, NEW.investor_id, 'branding_approved',
        jsonb_build_object('brand_name', NEW.brand_name, 'duration_days', NEW.duration_days));
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER branding_changes
BEFORE UPDATE ON public.branding_partnerships
FOR EACH ROW EXECUTE FUNCTION public.handle_branding_changes();

-- Storage bucket for brand logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('brand-logos', 'brand-logos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Brand logos publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'brand-logos');

CREATE POLICY "Authenticated users can upload brand logos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'brand-logos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own brand logos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'brand-logos' AND auth.uid()::text = (storage.foldername(name))[1]);