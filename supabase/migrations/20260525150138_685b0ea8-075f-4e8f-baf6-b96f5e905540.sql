
-- Enum for roles
CREATE TYPE public.app_role AS ENUM ('admin', 'contractor', 'owner');

CREATE TYPE public.project_status AS ENUM ('planning', 'in_progress', 'on_hold', 'completed');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  company TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles viewable by authenticated"
  ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users insert own profile"
  ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- User roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

CREATE POLICY "Users view own roles"
  ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all roles"
  ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles"
  ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Projects
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  status project_status NOT NULL DEFAULT 'planning',
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  budget NUMERIC(14,2),
  start_date DATE,
  end_date DATE,
  cover_image_url TEXT,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  contractor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project visibility"
  ON public.projects FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR auth.uid() = owner_id
    OR auth.uid() = contractor_id
    OR auth.uid() = created_by
  );

CREATE POLICY "Contractors & admins create"
  ON public.projects FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'contractor')
  );

CREATE POLICY "Contractors & admins update"
  ON public.projects FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR auth.uid() = contractor_id
  );

CREATE POLICY "Admins delete projects"
  ON public.projects FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Progress updates
CREATE TABLE public.progress_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  progress_percent INTEGER CHECK (progress_percent >= 0 AND progress_percent <= 100),
  photo_urls TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.progress_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Update visibility"
  ON public.progress_updates FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id
        AND (
          public.has_role(auth.uid(), 'admin')
          OR auth.uid() = p.owner_id
          OR auth.uid() = p.contractor_id
          OR auth.uid() = p.created_by
        )
    )
  );

CREATE POLICY "Contractor/admin post updates"
  ON public.progress_updates FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = author_id
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id
        AND (public.has_role(auth.uid(), 'admin') OR auth.uid() = p.contractor_id)
    )
  );

CREATE POLICY "Author can delete updates"
  ON public.progress_updates FOR DELETE TO authenticated
  USING (auth.uid() = author_id OR public.has_role(auth.uid(), 'admin'));

-- Documents
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  uploader_id UUID NOT NULL REFERENCES auth.users(id),
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Doc visibility"
  ON public.documents FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id
        AND (
          public.has_role(auth.uid(), 'admin')
          OR auth.uid() = p.owner_id
          OR auth.uid() = p.contractor_id
          OR auth.uid() = p.created_by
        )
    )
  );

CREATE POLICY "Contractor/admin upload docs"
  ON public.documents FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = uploader_id
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id
        AND (public.has_role(auth.uid(), 'admin') OR auth.uid() = p.contractor_id)
    )
  );

CREATE POLICY "Uploader/admin delete docs"
  ON public.documents FOR DELETE TO authenticated
  USING (auth.uid() = uploader_id OR public.has_role(auth.uid(), 'admin'));

-- Inquiries (public contact form)
CREATE TABLE public.inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  service TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone submit inquiry"
  ON public.inquiries FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins view inquiries"
  ON public.inquiries FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_projects_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create profile + default 'owner' role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _role app_role;
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, company)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'company'
  );

  _role := COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'owner');
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role);
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('project-photos', 'project-photos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('project-documents', 'project-documents', false);

-- Storage policies: project-photos (public read, contractor/admin write)
CREATE POLICY "Public read project photos"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'project-photos');
CREATE POLICY "Authenticated upload project photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'project-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Authenticated delete own project photos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'project-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies: project-documents (private, owner-folder model)
CREATE POLICY "Authenticated read own docs"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'project-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Authenticated upload own docs"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'project-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Authenticated delete own docs"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'project-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
