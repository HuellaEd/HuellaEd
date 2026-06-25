import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401, headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl    = Deno.env.get('SUPABASE_URL')!
    const anonKey        = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // 1. Verificar que el llamador es admin usando SU propio JWT
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const { data: isAdmin, error: adminError } = await callerClient.rpc('check_is_admin')
    if (adminError || !isAdmin) {
      return new Response(JSON.stringify({ error: 'Acceso denegado: no tenés permisos de administración' }), {
        status: 403, headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    // 2. Leer datos del body
    const { full_name, email, grade } = await req.json()
    if (!full_name?.trim() || !email?.trim()) {
      return new Response(JSON.stringify({ error: 'Nombre y email son requeridos' }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    // 3. Generar contraseña temporal (mismo patrón que admin-reset-password)
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
    const bytes = new Uint8Array(12)
    crypto.getRandomValues(bytes)
    const password = Array.from(bytes, b => chars[b % chars.length]).join('')

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // 4. Crear usuario en Supabase Auth (email confirmado automáticamente)
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email: email.trim(),
      password,
      email_confirm: true,
    })
    if (createError) {
      const msg = createError.message?.toLowerCase().includes('already registered')
        ? 'Ya existe un usuario con ese email'
        : `Error al crear usuario: ${createError.message}`
      return new Response(JSON.stringify({ error: msg }), {
        status: 409, headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    // 5. Crear registro en teachers vinculado al mismo id de Auth
    const { error: teacherError } = await adminClient.from('teachers').insert({
      id: newUser.user.id,
      email: email.trim(),
      full_name: full_name.trim(),
      grade: grade?.trim() || null,
    })
    if (teacherError) {
      // Rollback: eliminar el usuario Auth si falla la inserción en teachers
      await adminClient.auth.admin.deleteUser(newUser.user.id)
      return new Response(JSON.stringify({ error: `Error al crear registro del docente: ${teacherError.message}` }), {
        status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ password, teacher_id: newUser.user.id, full_name: full_name.trim() }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})
