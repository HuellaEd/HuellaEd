-- Asistencia del día actual, agregada por grado, para el banner de directivo.html.
-- Solo ejecutable por rol directivo (guard interno + revoke anon/public,
-- mismo patrón que check_is_admin()/revisar_observacion_eoe()).
create or replace function public.get_attendance_today_by_grade()
returns table (
  grade text,
  total_alumnos bigint,
  presentes bigint,
  ausentes bigint,
  justificados bigint,
  tardanzas bigint,
  sin_tomar bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from teachers where id = auth.uid() and rol = 'directivo') then
    raise exception 'Acceso denegado: solo directivo';
  end if;

  return query
  select
    coalesce(t.grade, '(sin grado)') as grade,
    count(distinct s.id) as total_alumnos,
    count(*) filter (where a.status = 'presente') as presentes,
    count(*) filter (where a.status = 'ausente') as ausentes,
    count(*) filter (where a.status = 'justificado') as justificados,
    count(*) filter (where a.status = 'tardanza') as tardanzas,
    count(distinct s.id) filter (where a.id is null) as sin_tomar
  from teachers t
  join students s on s.teacher_id = t.id and s.active is not false
  left join attendance a on a.student_id = s.id and a.date = current_date
  where t.rol = 'maestro'
  group by t.grade
  order by t.grade;
end;
$$;

revoke execute on function public.get_attendance_today_by_grade() from anon;
revoke execute on function public.get_attendance_today_by_grade() from public;
