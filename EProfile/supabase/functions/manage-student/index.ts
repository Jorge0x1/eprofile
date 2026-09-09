import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const headers = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }
Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers })
  try {
    const authorization = request.headers.get('Authorization')
    if (!authorization) throw new Error('No autenticado')
    const url = Deno.env.get('SUPABASE_URL')!
    const client = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const tokenClient = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authorization } } })
    const { data: { user } } = await tokenClient.auth.getUser()
    if (!user) throw new Error('Sesión inválida')
    const { data: role } = await client.from('user_roles').select('role').eq('user_id', user.id).single()
    if (role?.role !== 'platform_admin') throw new Error('Solo un administrador puede gestionar cuentas')
    const body = await request.json() as { action?: string; userId?: string; password?: string }
    if (!body.userId || !body.action) throw new Error('Acción y usuario son obligatorios')
    if (body.action === 'deactivate' || body.action === 'reactivate') await client.from('profiles').update({ is_active: body.action === 'reactivate' }).eq('id', body.userId)
    else if (body.action === 'reset_password') { if (!body.password || body.password.length < 6) throw new Error('La contraseña debe tener al menos 6 caracteres'); await client.auth.admin.updateUserById(body.userId, { password: body.password }) }
    else if (body.action === 'delete') { const result = await client.auth.admin.deleteUser(body.userId); if (result.error) throw result.error }
    else throw new Error('Acción no válida')
    return new Response(JSON.stringify({ ok: true }), { headers: { ...headers, 'Content-Type': 'application/json' } })
  } catch (error) { return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Error inesperado' }), { status: 400, headers: { ...headers, 'Content-Type': 'application/json' } }) }
})