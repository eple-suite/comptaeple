ALTER TABLE public.cofieple_exercises ADD COLUMN IF NOT EXISTS jours_tresorerie numeric NOT NULL DEFAULT 0;
ALTER TABLE public.cofieple_exercises ADD COLUMN IF NOT EXISTS tmcap numeric NOT NULL DEFAULT 0;
ALTER TABLE public.cofieple_exercises ADD COLUMN IF NOT EXISTS tmnr numeric NOT NULL DEFAULT 0;