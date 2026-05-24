create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  name text not null,
  cover_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
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
  updated_at timestamptz not null default now()
);

create table if not exists public.render_jobs (
  id uuid primary key default gen_random_uuid(),
  scene_id uuid not null references public.scenes(id) on delete cascade,
  status text not null default 'uploaded',
  openai_model text not null default 'gpt-image-2',
  openai_output_size text not null default '3840x1920',
  topaz_model text not null default 'High Fidelity V2',
  topaz_process_id text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.projects enable row level security;
alter table public.scenes enable row level security;
alter table public.render_jobs enable row level security;

create policy "Project owners can manage projects"
  on public.projects
  for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "Project owners can manage scenes"
  on public.scenes
  for all
  using (
    exists (
      select 1 from public.projects
      where projects.id = scenes.project_id
        and projects.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.projects
      where projects.id = scenes.project_id
        and projects.owner_id = auth.uid()
    )
  );

create policy "Project owners can manage render jobs"
  on public.render_jobs
  for all
  using (
    exists (
      select 1
      from public.scenes
      join public.projects on projects.id = scenes.project_id
      where scenes.id = render_jobs.scene_id
        and projects.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.scenes
      join public.projects on projects.id = scenes.project_id
      where scenes.id = render_jobs.scene_id
        and projects.owner_id = auth.uid()
    )
  );
