-- Permite a EOE/directivo crear ítems en la agenda de un docente puntual.
-- creado_por/creado_por_rol nullable: null = tarea normal del propio docente,
-- comportamiento y RLS existente de agenda quedan intactos.
alter table agenda
  add column creado_por uuid references auth.users null,
  add column creado_por_rol text null check (creado_por_rol in ('eoe','directivo'));

-- Inserta vía SECURITY DEFINER (la policy de agenda solo permite auth.uid()=user_id,
-- por eso EOE/directivo no pueden insertar directo para otro docente).
-- Mismo patrón que check_is_admin()/get_attendance_today_by_grade(): guard interno
-- + revoke anon/public, id generado server-side igual que el cliente (Date.now() en ms).
create or replace function public.asignar_tarea_agenda(p_teacher_id uuid, p_texto text)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rol text;
  v_new_id bigint;
begin
  select rol into v_rol from teachers where id = auth.uid() and activo = true;
  if v_rol is null or v_rol not in ('eoe','directivo') then
    raise exception 'Acceso denegado: solo EOE o directivo';
  end if;

  if p_texto is null or length(trim(p_texto)) = 0 then
    raise exception 'Texto vacío';
  end if;

  if not exists (select 1 from teachers where id = p_teacher_id and rol = 'maestro' and activo = true) then
    raise exception 'Docente inválido';
  end if;

  v_new_id := (extract(epoch from clock_timestamp()) * 1000)::bigint;

  insert into agenda (id, user_id, texto, cat, creado_por, creado_por_rol)
  values (v_new_id, p_teacher_id, p_texto, 'importante', auth.uid(), v_rol);

  return v_new_id;
end;
$$;

revoke execute on function public.asignar_tarea_agenda(uuid, text) from anon;
revoke execute on function public.asignar_tarea_agenda(uuid, text) from public;

-- Lista de docentes (id, nombre, grado) para que EOE elija destino al agendar.
-- Mismo guard de rol; solo lectura, análoga a directivo_lista_docentes pero
-- accesible también a EOE.
create or replace function public.eoe_lista_docentes()
returns table (id uuid, full_name text, grade text)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from teachers where teachers.id = auth.uid() and rol = 'eoe' and activo = true) then
    raise exception 'Acceso denegado: solo EOE';
  end if;

  return query
  select t.id, t.full_name, t.grade
  from teachers t
  where t.rol = 'maestro' and t.activo = true
  order by t.full_name;
end;
$$;

revoke execute on function public.eoe_lista_docentes() from anon;
revoke execute on function public.eoe_lista_docentes() from public;
