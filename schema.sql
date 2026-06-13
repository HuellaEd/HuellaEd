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

-- Catálogo de materias (UUIDs fijos, no varían)
create table subjects (
  id uuid primary key,
  code text not null unique,
  name text not null
);
alter table subjects enable row level security;
create policy "Subjects legibles para autenticados" on subjects
  for select using (auth.role() = 'authenticated');
create policy "Subjects insertables para autenticados" on subjects
  for insert with check (auth.role() = 'authenticated');

-- Seed de materias (ejecutar una sola vez)
insert into subjects (id, code, name) values
  ('10000000-0000-0000-0000-000000000001', 'L',  'Lengua'),
  ('10000000-0000-0000-0000-000000000002', 'M',  'Matemática'),
  ('10000000-0000-0000-0000-000000000003', 'CS', 'Cs.Sociales'),
  ('10000000-0000-0000-0000-000000000004', 'CN', 'Cs.Naturales'),
  ('10000000-0000-0000-0000-000000000005', 'I',  'Inglés'),
  ('10000000-0000-0000-0000-000000000006', 'EA', 'Ed.Artística'),
  ('10000000-0000-0000-0000-000000000007', 'EF', 'Ed.Física')
on conflict (id) do nothing;

-- Calificaciones por alumno, materia y período
drop table if exists grades;
create table grades (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references students(id) not null,
  teacher_id uuid references auth.users not null,
  subject_id uuid references subjects(id) not null,
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
