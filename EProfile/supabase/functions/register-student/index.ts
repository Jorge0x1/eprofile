import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const body = await request.json() as { email?: string; password?: string; slug?: string }
    const email = body.email?.trim().toLowerCase()
    const password = body.password
    const slug = body.slug?.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-')
    if (!email || !password || !slug) throw new Error('Correo, contraseña y ruta son obligatorios')
    if (password.length < 6) throw new Error('La contraseña debe tener al menos 6 caracteres')

    const adminClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { data: created, error: createError } = await adminClient.auth.admin.createUser({ email, password, email_confirm: true })
    if (createError || !created.user) throw createError ?? new Error('No se pudo crear la cuenta')
    const userId = created.user.id
    const roleResult = await adminClient.from('user_roles').insert({ user_id: userId, role: 'student' })
    const profileResult = await adminClient.from('profiles').insert({ id: userId, slug, status: 'empty', is_active: true })
    const contentResult = await adminClient.from('profile_content').insert([{ profile_id: userId, version_status: 'draft' }, { profile_id: userId, version_status: 'published' }])
    if (roleResult.error || profileResult.error || contentResult.error) { await adminClient.auth.admin.deleteUser(userId); throw roleResult.error ?? profileResult.error ?? contentResult.error ?? new Error('No se pudo crear el perfil') }
    return new Response(JSON.stringify({ id: userId, email, slug }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Error inesperado' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})