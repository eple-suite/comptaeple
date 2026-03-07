
-- Timestamp update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'agent');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  first_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL DEFAULT '',
  academy TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'agent',
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Establishments table
CREATE TABLE public.establishments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  uai TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'Lycée',
  academy TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.establishments ENABLE ROW LEVEL SECURITY;

-- Balances table
CREATE TABLE public.balances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  establishment_id UUID REFERENCES public.establishments(id) ON DELETE CASCADE NOT NULL,
  year INTEGER NOT NULL,
  account_number TEXT NOT NULL,
  account_label TEXT NOT NULL DEFAULT '',
  debit NUMERIC(15,2) NOT NULL DEFAULT 0,
  credit NUMERIC(15,2) NOT NULL DEFAULT 0,
  balance NUMERIC(15,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.balances ENABLE ROW LEVEL SECURITY;

-- Indicators table
CREATE TABLE public.indicators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  establishment_id UUID REFERENCES public.establishments(id) ON DELETE CASCADE NOT NULL,
  year INTEGER NOT NULL,
  fdr NUMERIC(15,2) DEFAULT 0,
  bfr NUMERIC(15,2) DEFAULT 0,
  treasury NUMERIC(15,2) DEFAULT 0,
  operating_days NUMERIC(10,2) DEFAULT 0,
  recovery_rate NUMERIC(5,2) DEFAULT 0,
  exercise_result NUMERIC(15,2) DEFAULT 0,
  charges_weight NUMERIC(5,2) DEFAULT 0,
  srh_weight NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(establishment_id, year)
);
ALTER TABLE public.indicators ENABLE ROW LEVEL SECURITY;

-- Audit logs
CREATE TABLE public.logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  uai TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;

-- User-establishment link (which establishments a user can access)
CREATE TABLE public.user_establishments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  establishment_id UUID REFERENCES public.establishments(id) ON DELETE CASCADE NOT NULL,
  UNIQUE(user_id, establishment_id)
);
ALTER TABLE public.user_establishments ENABLE ROW LEVEL SECURITY;

-- TRIGGERS
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_establishments_updated_at BEFORE UPDATE ON public.establishments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, first_name, last_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'first_name', ''), COALESCE(NEW.raw_user_meta_data->>'last_name', ''));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'agent');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS POLICIES

-- Profiles: users see own, admins see all
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User roles: users see own, admins manage
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Establishments: authenticated users can read, admins can manage
CREATE POLICY "Authenticated users can view establishments" ON public.establishments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage establishments" ON public.establishments FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Balances: users can read establishments they have access to
CREATE POLICY "Users can view balances of their establishments" ON public.balances FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.user_establishments ue WHERE ue.user_id = auth.uid() AND ue.establishment_id = balances.establishment_id)
  OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Authenticated can insert balances" ON public.balances FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.user_establishments ue WHERE ue.user_id = auth.uid() AND ue.establishment_id = balances.establishment_id)
  OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Authenticated can update balances" ON public.balances FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.user_establishments ue WHERE ue.user_id = auth.uid() AND ue.establishment_id = balances.establishment_id)
  OR public.has_role(auth.uid(), 'admin')
);

-- Indicators: same as balances
CREATE POLICY "Users can view indicators" ON public.indicators FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.user_establishments ue WHERE ue.user_id = auth.uid() AND ue.establishment_id = indicators.establishment_id)
  OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Authenticated can insert indicators" ON public.indicators FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.user_establishments ue WHERE ue.user_id = auth.uid() AND ue.establishment_id = indicators.establishment_id)
  OR public.has_role(auth.uid(), 'admin')
);

-- Logs: users see own, admins see all
CREATE POLICY "Users can view own logs" ON public.logs FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated can insert logs" ON public.logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- User establishments
CREATE POLICY "Users can view own links" ON public.user_establishments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage user establishments" ON public.user_establishments FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Indexes
CREATE INDEX idx_balances_establishment_year ON public.balances(establishment_id, year);
CREATE INDEX idx_indicators_establishment_year ON public.indicators(establishment_id, year);
CREATE INDEX idx_logs_user_id ON public.logs(user_id);
CREATE INDEX idx_logs_created_at ON public.logs(created_at DESC);
CREATE INDEX idx_user_establishments_user ON public.user_establishments(user_id);
