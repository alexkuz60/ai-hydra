-- Enum для ролей
CREATE TYPE public.app_role AS ENUM ('user', 'moderator', 'admin', 'supervisor');

-- Таблица ролей пользователей
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Включить RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Функция проверки роли (SECURITY DEFINER для обхода RLS)
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

-- Функция проверки admin/supervisor
CREATE OR REPLACE FUNCTION public.is_admin_or_supervisor(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin', 'supervisor')
  )
$$;

-- RLS политики
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Supervisors can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'supervisor'));

CREATE POLICY "Supervisors can insert roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'supervisor'));

CREATE POLICY "Supervisors can update roles"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'supervisor'));

CREATE POLICY "Supervisors can delete roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'supervisor'));

-- Назначить роли supervisor и admin для AlexKuz
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'supervisor'::app_role
FROM public.profiles
WHERE username = 'AlexKuz';

INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'admin'::app_role
FROM public.profiles
WHERE username = 'AlexKuz';