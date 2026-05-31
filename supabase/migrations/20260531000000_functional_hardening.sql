create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid default auth.uid(),
  name text not null,
  cover_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint projects_owner_id_not_null check (owner_id is not null)
);

create table if not exists public.scenes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  preset_id text not null,
  status text not null default 'uploaded',
  notes text not null default '',
  source_path text,
  openai_render_path text,
  topaz_final_path text,
  source_width integer,
  source_height integer,
  final_width integer,
  final_height integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint scenes_status_check check (status in ('uploaded', 'rendering_openai', 'upscaling_topaz', 'ready', 'failed')),
  constraint scenes_preset_check check (preset_id in ('interior', 'exterior_mendung', 'exterior_cerah', 'aerial_view_mendung'))
);

create table if not exists public.render_jobs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid default auth.uid(),
  scene_id uuid not null references public.scenes(id) on delete cascade,
  mode text not null default 'real',
  status text not null default 'uploaded',
  openai_model text not null default 'gpt-image-1.5',
  openai_output_size text not null default '1536x1024',
  topaz_model text not null default 'High Fidelity V2',
  topaz_process_id text,
  error_message text,
  started_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint render_jobs_owner_id_not_null check (owner_id is not null),
  constraint render_jobs_mode_check check (mode in ('mock', 'real')),
  constraint render_jobs_status_check check (status in ('uploaded', 'rendering_openai', 'upscaling_topaz', 'ready', 'failed'))
);

alter table public.render_jobs add column if not exists owner_id uuid default auth.uid();
alter table public.render_jobs add column if not exists mode text not null default 'real';
alter table public.render_jobs add column if not exists started_at timestamptz not null default now();

create index if not exists projects_owner_id_idx on public.projects(owner_id);
create index if not exists scenes_project_id_idx on public.scenes(project_id);
create index if not exists render_jobs_owner_started_idx on public.render_jobs(owner_id, started_at);
create index if not exists render_jobs_scene_id_idx on public.render_jobs(scene_id);
create index if not exists render_jobs_topaz_process_id_idx on public.render_jobs(topaz_process_id);

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at before update on public.projects for each row execute function public.set_updated_at();

drop trigger if exists scenes_set_updated_at on public.scenes;
create trigger scenes_set_updated_at before update on public.scenes for each row execute function public.set_updated_at();

drop trigger if exists render_jobs_set_updated_at on public.render_jobs;
create trigger render_jobs_set_updated_at before update on public.render_jobs for each row execute function public.set_updated_at();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('360-renders', '360-renders', false, 52428800, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

alter table public.projects enable row level security;
alter table public.scenes enable row level security;
alter table public.render_jobs enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.projects to authenticated;
grant select, insert, update, delete on table public.scenes to authenticated;
grant select, insert, update, delete on table public.render_jobs to authenticated;

drop policy if exists "Project owners can manage projects" on public.projects;
create policy "Project owners can manage projects"
  on public.projects for all to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

drop policy if exists "Project owners can manage scenes" on public.scenes;
create policy "Project owners can manage scenes"
  on public.scenes for all to authenticated
  using (
    exists (
      select 1 from public.projects
      where projects.id = scenes.project_id
        and projects.owner_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.projects
      where projects.id = scenes.project_id
        and projects.owner_id = (select auth.uid())
    )
  );

drop policy if exists "Project owners can manage render jobs" on public.render_jobs;
create policy "Project owners can manage render jobs"
  on public.render_jobs for all to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

drop policy if exists "Owners can read 360 render assets" on storage.objects;
create policy "Owners can read 360 render assets"
  on storage.objects for select to authenticated
  using (bucket_id = '360-renders' and owner_id = (select auth.uid())::text);

drop policy if exists "Owners can upload 360 render assets" on storage.objects;
create policy "Owners can upload 360 render assets"
  on storage.objects for insert to authenticated
  with check (bucket_id = '360-renders' and owner_id = (select auth.uid())::text);
