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

-- Calificaciones por alumno, materia y período
create table grades (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references students(id) not null,
  teacher_id uuid references auth.users not null,
  subject_id text not null,
  period text not null,
  score numeric(4,1),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (student_id, subject_id, period)
);
alter table grades enable row level security;
create policy "Docentes gestionan sus calificaciones" on grades for all
  using (auth.uid() = teacher_id) with check (auth.uid() = teacher_id);

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
