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

    // Estas 3 variables son inyectadas automáticamente por Supabase.
    // La service role key NUNCA sale del servidor.
    const supabaseUrl      = Deno.env.get('SUPABASE_URL')!
    const anonKey          = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceRoleKey   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

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

    // 2. Leer teacher_id (y opcionalmente new_password) del body
    const { teacher_id, new_password } = await req.json()
    if (!teacher_id) {
      return new Response(JSON.stringify({ error: 'teacher_id requerido' }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }
    if (new_password !== undefined && new_password !== null && typeof new_password !== 'string') {
      return new Response(JSON.stringify({ error: 'new_password debe ser un string' }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    // 3. Password: si el admin mandó new_password, usarla (con piso mínimo de
    // 6 caracteres para evitar un typo que deje una cuenta con clave de 1 caracter).
    // Si no viene o viene vacía, mantener el comportamiento actual: generar
    // contraseña temporal legible de 12 caracteres, sin caracteres ambiguos
    // (sin 0/O, sin I/l/1).
    let password: string
    if (typeof new_password === 'string' && new_password.trim().length > 0) {
      if (new_password.trim().length < 6) {
        return new Response(JSON.stringify({ error: 'new_password debe tener al menos 6 caracteres' }), {
          status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
        })
      }
      password = new_password
    } else {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
      const bytes = new Uint8Array(12)
      crypto.getRandomValues(bytes)
      password = Array.from(bytes, b => chars[b % chars.length]).join('')
    }

    // 4. Aplicar la contraseña via Admin API con service role key (solo server-side)
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const { error: updateError } = await adminClient.auth.admin.updateUserById(teacher_id, { password })
    if (updateError) {
      return new Response(JSON.stringify({ error: `Error al actualizar contraseña: ${updateError.message}` }), {
        status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ password }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})
