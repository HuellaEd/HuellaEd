-- Fichas de conocimiento del alumno
create table fichas (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  alumno text not null,
  fecha text,
  chips jsonb default '[]'::jsonb,
  textos jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, alumno)
);
alter table fichas enable row level security;
create policy "Docentes gestionan sus fichas" on fichas for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Notas rápidas del docente
create table notas_rapidas (
  id bigint primary key,
  user_id uuid references auth.users not null,
  fecha text,
  destino text,
  alumno text default '',
  texto text not null,
  created_at timestamptz default now()
);
alter table notas_rapidas enable row level security;
create policy "Docentes gestionan sus notas" on notas_rapidas for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Agenda (tareas del docente)
create table agenda (
  id bigint primary key,
  user_id uuid references auth.users not null,
  texto text not null,
  cat text not null,
  hecha boolean default false,
  created_at timestamptz default now()
);
alter table agenda enable row level security;
create policy "Docentes gestionan su agenda" on agenda for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
