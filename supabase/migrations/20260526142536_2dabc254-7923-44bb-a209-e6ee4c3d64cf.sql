
-- PHASES
CREATE TABLE public.project_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  order_index INTEGER NOT NULL DEFAULT 0,
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_phases TO authenticated;
GRANT ALL ON public.project_phases TO service_role;
ALTER TABLE public.project_phases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Phases visibility" ON public.project_phases FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND (
  public.has_role(auth.uid(),'admin') OR auth.uid() = p.owner_id OR auth.uid() = p.contractor_id OR auth.uid() = p.created_by
)));
CREATE POLICY "Phases manage by contractor/admin" ON public.project_phases FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND (
  public.has_role(auth.uid(),'admin') OR auth.uid() = p.contractor_id
)))
WITH CHECK (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND (
  public.has_role(auth.uid(),'admin') OR auth.uid() = p.contractor_id
)));

CREATE TRIGGER trg_phases_updated BEFORE UPDATE ON public.project_phases
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- COMMENTS
CREATE TABLE public.progress_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  update_id UUID NOT NULL REFERENCES public.progress_updates(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.progress_comments TO authenticated;
GRANT ALL ON public.progress_comments TO service_role;
ALTER TABLE public.progress_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments visibility" ON public.progress_comments FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.progress_updates u
  JOIN public.projects p ON p.id = u.project_id
  WHERE u.id = update_id AND (
    public.has_role(auth.uid(),'admin') OR auth.uid() = p.owner_id OR auth.uid() = p.contractor_id OR auth.uid() = p.created_by
  )
));
CREATE POLICY "Comments insert by project members" ON public.progress_comments FOR INSERT TO authenticated
WITH CHECK (auth.uid() = author_id AND EXISTS (
  SELECT 1 FROM public.progress_updates u
  JOIN public.projects p ON p.id = u.project_id
  WHERE u.id = update_id AND (
    public.has_role(auth.uid(),'admin') OR auth.uid() = p.owner_id OR auth.uid() = p.contractor_id OR auth.uid() = p.created_by
  )
));
CREATE POLICY "Comments delete by author/admin" ON public.progress_comments FOR DELETE TO authenticated
USING (auth.uid() = author_id OR public.has_role(auth.uid(),'admin'));
