import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const authorization = request.headers.get('Authorization')
    if (!authorization) throw new Error('No autenticado')

    const authClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authorization } },
    })
    const { data: { user: requester }, error: requesterError } = await authClient.auth.getUser()
    if (requesterError || !requester) throw new Error('Sesión inválida')

    const adminClient = createClient(supabaseUrl, serviceRoleKey)
    const { data: role } = await adminClient.from('user_roles').select('role').eq('user_id', requester.id).single()
    if (role?.role !== 'platform_admin') throw new Error('Solo un administrador puede crear estudiantes')

    const body = await request.json() as { email?: string; password?: string; slug?: string }
    const email = body.email?.trim().toLowerCase()
    const password = body.password
    const slug = body.slug?.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-')
    if (!email || !password || !slug) throw new Error('Correo, contraseña y slug son obligatorios')
    if (password.length < 6) throw new Error('La contraseña debe tener al menos 6 caracteres')

    const { data: created, error: createError } = await adminClient.auth.admin.createUser({ email, password, email_confirm: true })
    if (createError || !created.user) throw createError ?? new Error('No se pudo crear el usuario')

    const userId = created.user.id
    const { error: roleError } = await adminClient.from('user_roles').insert({ user_id: userId, role: 'student' })
    const { error: profileError } = await adminClient.from('profiles').insert({ id: userId, slug, status: 'empty', is_active: true })
    const { error: contentError } = await adminClient.from('profile_content').insert([
      { profile_id: userId, version_status: 'draft' },
      { profile_id: userId, version_status: 'published' },
    ])

    if (roleError || profileError || contentError) {
      await adminClient.auth.admin.deleteUser(userId)
      throw roleError ?? profileError ?? contentError ?? new Error('No se pudo guardar el perfil')
    }

    return new Response(JSON.stringify({ id: userId, email, slug }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Error inesperado' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
