import { useEffect, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import './App.css'
import { supabase } from './utils/supabase'
import { QRCodeSVG } from 'qrcode.react'
import { jsPDF } from 'jspdf'

type View = 'landing' | 'admin'
type AppRole = 'student' | 'platform_admin'
type AuthSession = Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session']

function App() {
  const [view, setView] = useState<View>('landing')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const publicSlug = window.location.pathname.split('/').filter(Boolean)[0]

  return (
    <main className="app-shell">
      {publicSlug && view === 'landing' ? <PublicProfilePage slug={publicSlug} onBack={() => { window.history.pushState({}, '', '/'); window.location.reload() }} /> : view === 'landing' ? <Landing onAdmin={() => setView('admin')} onMenu={() => setIsMenuOpen(!isMenuOpen)} isMenuOpen={isMenuOpen} /> : <Admin onBack={() => setView('landing')} />}
    </main>
  )
}

function Landing({ onAdmin, onMenu, isMenuOpen }: { onAdmin: () => void; onMenu: () => void; isMenuOpen: boolean }) {
  return <div className="landing-page">
    <nav className="topbar"><button className="brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}><span className="brand-mark">e</span><span>EProfile</span></button><div className={`nav-links ${isMenuOpen ? 'is-open' : ''}`}><a href="#como-funciona">Cómo funciona</a><a href="#perfiles">Explorar perfiles</a><button className="nav-admin" onClick={onAdmin}>Administrar perfil <span>↗</span></button></div><button className="menu-button" onClick={onMenu} aria-label="Abrir menú">☰</button></nav>
    <section className="landing-hero"><div className="hero-copy"><p className="eyebrow"><span className="eyebrow-dot" /> Tu trabajo, en un solo lugar</p><h1>Haz que tu<br /><em>historia</em> avance.</h1><p className="hero-description">Una tarjeta digital viva para mostrar quién eres, lo que haces y hacia dónde vas.</p><div className="hero-actions"><button className="primary-button" onClick={onAdmin}>Crear mi EProfile <span>↗</span></button><a className="text-button" href="#como-funciona">Conoce la plataforma <span>↓</span></a></div><div className="hero-note"><span>✦</span> Diseñado para estudiantes que están construyendo su próximo paso.</div></div><div className="hero-visual" aria-label="Vista previa de un perfil profesional"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="profile-card"><div className="card-topline"><span>EPROFILE / PREVIEW</span><span className="live-dot">● LIVE</span></div><div className="portrait portrait-large">EP</div><p className="card-kicker">TU PROFESIÓN · TU CIUDAD</p><h2>Tu<br /><span>historia.</span></h2><p className="card-bio">Presenta tus ideas, habilidades y proyectos en un solo lugar.</p><div className="card-footer"><span>tu-eprofile.com</span><span className="arrow-circle">↗</span></div></div><div className="floating-tag tag-qr"><span>⌁</span> QR listo para compartir</div><div className="floating-tag tag-projects"><strong>+</strong><span>tus proyectos<br />publicados</span></div></div></section>
    <section className="proof-strip"><span>UNA PRESENCIA QUE TE ACOMPAÑA</span><span className="proof-line" /><span>EN CADA NUEVA OPORTUNIDAD</span><span className="proof-symbol">✳</span></section>
    <section className="feature-section" id="como-funciona"><div className="section-heading"><p className="eyebrow">Todo lo que importa</p><h2>Tu perfil no es un documento.<br /><em>Es una puerta.</em></h2></div><div className="feature-grid"><Feature number="01" title="Preséntate mejor" text="Foto, recorrido, habilidades y proyectos en una experiencia que sí se parece a ti." accent="coral" /><Feature number="02" title="Actualiza en segundos" text="Guarda un borrador, revísalo y publica cuando todo esté listo. Sin tocar código." accent="yellow" /><Feature number="03" title="Comparte sin límites" text="Un enlace fijo y un código QR para que tu trabajo siempre llegue a la persona correcta." accent="mint" /></div></section>
    <PublicProfiles />
    <footer className="site-footer"><span className="brand"><span className="brand-mark">e</span> EProfile</span><span>Una mejor forma de decir quién eres.</span><span>© 2026 EProfile</span></footer>
  </div>
}

type PublicProfile = { id: string; slug: string; full_name: string | null; career: string | null; bio: string | null; avatar_url: string | null }

function PublicProfilePage({ slug, onBack }: { slug: string; onBack: () => void }) {
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [content, setContent] = useState<{ education: string[]; experience: string[]; skills: string[]; projects: { name: string; description: string; url: string }[]; contacts: { email?: string; linkedin?: string; github?: string; phone?: string } } | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    void supabase.from('profiles').select('id, slug, full_name, career, bio, avatar_url').eq('slug', slug).eq('status', 'published').eq('is_active', true).single().then(async ({ data }) => {
      if (data) {
        setProfile(data as PublicProfile)
        const result = await supabase.from('profile_content').select('education, experience, skills, projects, contacts').eq('profile_id', data.id).eq('version_status', 'published').single()
        if (result.data) setContent(result.data as typeof content)
      }
      setIsLoading(false)
    })
  }, [slug])

  if (isLoading) return <div className="admin-loading">Cargando EProfile...</div>
  if (!profile) return <div className="public-not-found"><span>404</span><h1>Este perfil no está disponible.</h1><button className="primary-button" onClick={onBack}>Volver a EProfile</button></div>
  const contacts = content?.contacts ?? {}
  function downloadPdf() { const pdf = new jsPDF(); pdf.setFillColor(32, 39, 37); pdf.rect(0, 0, 210, 297, 'F'); pdf.setTextColor(246, 244, 238); pdf.setFontSize(11); pdf.text('EPROFILE / TARJETA DIGITAL', 20, 25); pdf.setFontSize(32); pdf.text(profile!.full_name ?? 'EProfile', 20, 62); pdf.setTextColor(244, 135, 103); pdf.setFontSize(16); pdf.text(profile!.career ?? '', 20, 75); pdf.setTextColor(210, 220, 213); pdf.setFontSize(12); const bioLines = pdf.splitTextToSize(profile!.bio ?? '', 165); pdf.text(bioLines, 20, 98); let y = 125; if (content?.skills?.length) { pdf.setTextColor(244, 135, 103); pdf.text('HABILIDADES', 20, y); pdf.setTextColor(246, 244, 238); pdf.text(content.skills.join(' · '), 20, y + 10, { maxWidth: 165 }); y += 30 } pdf.setTextColor(170, 181, 172); pdf.setFontSize(10); pdf.text(window.location.href, 20, 270); pdf.save(`${profile!.slug}-eprofile.pdf`) }
  return <div className="public-profile-page"><nav className="public-nav"><button className="brand" onClick={onBack}><span className="brand-mark">e</span><span>EProfile</span></button><span>/{profile.slug}</span></nav><main className="public-profile-main"><section className="public-identity"><div className="public-hero-avatar">{profile.avatar_url ? <img src={profile.avatar_url} alt={profile.full_name ?? ''} /> : (profile.full_name ?? profile.slug).slice(0, 2).toUpperCase()}</div><p className="eyebrow">EProfile pública</p><h1>{profile.full_name}</h1><h2>{profile.career}</h2><p>{profile.bio}</p><div className="public-actions"><button className="primary-button" onClick={downloadPdf}>Descargar PDF <span>↓</span></button></div><div className="public-qr"><QRCodeSVG value={window.location.href} size={132} bgColor="#fffefa" fgColor="#1d2523" /><div><strong>Comparte esta EProfile</strong><span>Escanea para volver a este perfil</span></div></div></section><section className="public-details">{content?.skills?.length ? <PublicSection title="Habilidades"><div className="skill-list">{content.skills.map((skill) => <span key={skill}>{skill}</span>)}</div></PublicSection> : null}{content?.education?.length ? <PublicSection title="Formación"><ListItems items={content.education} /></PublicSection> : null}{content?.experience?.length ? <PublicSection title="Experiencia"><ListItems items={content.experience} /></PublicSection> : null}{content?.projects?.length ? <PublicSection title="Proyectos"><div className="public-projects">{content.projects.map((project) => <article key={`${project.name}-${project.url}`}><h3>{project.name}</h3><p>{project.description}</p>{project.url && <a href={project.url} target="_blank">Ver proyecto ↗</a>}</article>)}</div></PublicSection> : null}<div className="public-links">{contacts.linkedin && <a href={contacts.linkedin} target="_blank">LinkedIn ↗</a>}{contacts.github && <a href={contacts.github} target="_blank">GitHub ↗</a>}{contacts.phone && <a href={`tel:${contacts.phone}`}>Teléfono ↗</a>}</div></section></main></div>
}

function PublicSection({ title, children }: { title: string; children: ReactNode }) { return <section className="public-section"><p className="eyebrow">{title}</p>{children}</section> }
function ListItems({ items }: { items: string[] }) { return <ul className="public-list">{items.map((item) => <li key={item}>{item}</li>)}</ul> }

function PublicProfiles() {
  const [profiles, setProfiles] = useState<PublicProfile[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    void supabase.from('profiles').select('id, slug, full_name, career, bio, avatar_url').eq('status', 'published').eq('is_active', true).order('updated_at', { ascending: false }).then(({ data, error: queryError }) => {
      if (queryError) setError(queryError.message)
      setProfiles((data ?? []) as PublicProfile[])
      setIsLoading(false)
    })
  }, [])

  function move(direction: number) {
    setActiveIndex((current) => profiles.length ? (current + direction + profiles.length) % profiles.length : 0)
  }

  return <section className="public-profiles-section" id="perfiles"><div className="section-heading split-heading"><div><p className="eyebrow">La comunidad EProfile</p><h2>Explora perfiles<br /><em>que inspiran.</em></h2></div><div className="carousel-controls"><button className="carousel-button" onClick={() => move(-1)} aria-label="Perfil anterior">←</button><span>{profiles.length ? `${String(activeIndex + 1).padStart(2, '0')} / ${String(profiles.length).padStart(2, '0')}` : '— / —'}</span><button className="carousel-button" onClick={() => move(1)} aria-label="Siguiente perfil">→</button></div></div>{error && <p className="public-profiles-message">No se pudieron cargar los perfiles públicos.</p>}{isLoading ? <p className="public-profiles-message">Cargando perfiles públicos...</p> : profiles.length === 0 ? <div className="public-profiles-empty"><span>✦</span><p>Aún no hay perfiles publicados.</p><small>Cuando un estudiante publique su EProfile, aparecerá aquí.</small></div> : <div className="public-profile-carousel">{profiles.map((profile, index) => <PublicProfileCard key={profile.id} profile={profile} isActive={index === activeIndex} />)}</div>}</section>
}

function PublicProfileCard({ profile, isActive }: { profile: PublicProfile; isActive: boolean }) {
  const initials = (profile.full_name || profile.slug).split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()
  return <a className={`public-profile-card ${isActive ? 'is-active' : ''}`} href={`/${profile.slug}`}><div className="public-profile-avatar">{profile.avatar_url ? <img src={profile.avatar_url} alt="" /> : initials}</div><div className="public-profile-info"><p className="public-profile-slug">EPROFILE / {profile.slug}</p><h3>{profile.full_name || 'Perfil sin nombre'}</h3><p className="public-profile-career">{profile.career || 'Estudiante'}</p><p className="public-profile-bio">{profile.bio || 'Conoce su trayectoria y proyectos.'}</p></div><span className="public-profile-arrow">↗</span></a>
}

function Feature({ number, title, text, accent }: { number: string; title: string; text: string; accent: string }) { return <article className={`feature-card ${accent}`}><span className="feature-number">{number}</span><div className="feature-icon">{accent === 'coral' ? '✦' : accent === 'yellow' ? '↗' : '⌁'}</div><h3>{title}</h3><p>{text}</p><span className="feature-arrow">↗</span></article> }
function Admin({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState('Resumen')
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)
  const [session, setSession] = useState<AuthSession>(null)
  const [userRole, setUserRole] = useState<AppRole | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')

  useEffect(() => {
    void supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session!)
      if (data.session) setUserRole(await getUserRole(data.session.user.id))
      setSessionReady(true)
    })
  }, [])

  async function login() {
    setLoginError('')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setLoginError('Correo o contraseña incorrectos.'); return }
    const { data: role, error: roleError } = await supabase.from('user_roles').select('role').eq('user_id', data.user.id).single()
    if (roleError || !role) { await supabase.auth.signOut(); setLoginError(`No se pudo validar el rol: ${roleError?.message ?? 'rol no encontrado'}`); return }
    setSession(data.session)
    setUserRole(role.role as AppRole)
  }

  async function logout() { await supabase.auth.signOut(); setSession(null); onBack() }

  if (!sessionReady) return <div className="admin-loading">Cargando acceso seguro...</div>
  if (!session) return <AdminLogin email={email} password={password} error={loginError} setEmail={setEmail} setPassword={setPassword} onLogin={() => void login()} onBack={onBack} />
  if (userRole === 'student') return <StudentPanel session={session} onLogout={() => void logout()} />
  if (userRole !== 'platform_admin') return <div className="admin-loading">Validando permisos...</div>

    return <div className="admin-page"><aside className="admin-sidebar"><button className="brand admin-brand" onClick={onBack}><span className="brand-mark">e</span><span>EProfile</span></button><p className="sidebar-label">PLATAFORMA</p><div className="sidebar-nav">{['Resumen', 'Perfiles', 'Configuración'].map((item) => <button key={item} className={activeTab === item ? 'active' : ''} onClick={() => setActiveTab(item)}><span className="sidebar-icon">{item === 'Resumen' ? '◈' : item === 'Perfiles' ? '◌' : '⚙'}</span>{item}</button>)}</div><div className={`sidebar-bottom ${isAccountMenuOpen ? 'is-open' : ''}`}><button className="sidebar-account" onClick={() => setIsAccountMenuOpen((open) => !open)}><div className="admin-avatar">AD</div><div><strong>{session.user.email}</strong><span>Administrador</span></div><span className="account-chevron">⌄</span></button>{isAccountMenuOpen && <button className="logout-menu-item" onClick={() => void logout()}>↪ Cerrar sesión</button>}</div></aside><section className="admin-content"><header className="admin-header"><div><p className="breadcrumb">PLATAFORMA / {activeTab.toUpperCase()}</p><h1>{activeTab === 'Resumen' ? 'Buenos días, Admin.' : activeTab}</h1></div><div className="header-actions"><button className="icon-button" aria-label="Notificaciones">♢<span className="notification-dot" /></button><button className="admin-profile">AD <span>⌄</span></button></div></header>{activeTab === 'Resumen' ? <Dashboard /> : activeTab === 'Perfiles' ? <AdminProfiles /> : <AdminSettings />}</section></div>
}

type ManagedProfile = StudentProfile & { is_active: boolean }

function AdminProfiles() {
  const [profiles, setProfiles] = useState<ManagedProfile[]>([])
  const [selectedProfile, setSelectedProfile] = useState<ManagedProfile | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  async function load() { const { data, error: queryError } = await supabase.from('profiles').select('id, slug, full_name, career, status, updated_at, is_active').order('updated_at', { ascending: false }); if (queryError) setError(queryError.message); else setProfiles((data ?? []) as ManagedProfile[]) }
  useEffect(() => { void load() }, [])
  async function manage(id: string, action: 'deactivate' | 'reactivate' | 'delete' | 'reset_password') { setMessage(''); setError(''); const password = action === 'reset_password' ? window.prompt('Nueva contraseña temporal') : undefined; if (action === 'reset_password' && !password) return; const { error: functionError } = await supabase.functions.invoke('manage-student', { body: { action, userId: id, password } }); if (functionError) setError(functionError.message); else { setMessage('Acción aplicada correctamente.'); void load() } }
  return <div className="management-view"><div className="management-toolbar"><div><p className="eyebrow">Control de publicación y acceso</p><h2>Todos los perfiles</h2></div><button className="outline-button" onClick={() => void load()}>Actualizar ↻</button></div>{message && <p className="form-success">{message}</p>}{error && <p className="form-error">{error}</p>}<div className="management-list">{profiles.length === 0 ? <p className="panel-message">No hay estudiantes registrados.</p> : profiles.map((profile) => <article className="management-row" key={profile.id} onClick={() => setSelectedProfile(profile)}><div className="management-avatar">{(profile.full_name || profile.slug).slice(0, 2).toUpperCase()}</div><div className="management-info"><strong>{profile.full_name || 'Sin nombre'}</strong><span>/{profile.slug} · {profile.career || 'Sin carrera'}</span></div><span className={`status status-${profile.status === 'published' ? 'peach' : profile.status === 'draft' ? 'yellow' : 'mint'}`}>{profile.status === 'published' ? 'Publicado' : profile.status === 'draft' ? 'Borrador' : 'Vacío'}</span><span className={`account-state ${profile.is_active ? 'is-active' : 'is-inactive'}`}>{profile.is_active ? 'Activa' : 'Inactiva'}</span><div className="management-actions"><button onClick={(event) => { event.stopPropagation(); void manage(profile.id, profile.is_active ? 'deactivate' : 'reactivate') }}>{profile.is_active ? 'Desactivar' : 'Reactivar'}</button><button onClick={(event) => { event.stopPropagation(); void manage(profile.id, 'reset_password') }}>Reiniciar clave</button><button className="danger-action" onClick={(event) => { event.stopPropagation(); if (window.confirm('¿Eliminar esta cuenta?')) void manage(profile.id, 'delete') }}>Eliminar</button></div></article>)}</div>{selectedProfile && <ProfileDetailsModal profile={selectedProfile} onClose={() => setSelectedProfile(null)} />}</div>
}

function ProfileDetailsModal({ profile, onClose }: { profile: ManagedProfile; onClose: () => void }) {
  const statusLabel = profile.status === 'published' ? 'Publicado' : profile.status === 'draft' ? 'Borrador' : 'Vacío'
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section className="profile-details-modal" role="dialog" aria-modal="true" aria-labelledby="profile-details-title"><button className="modal-close" onClick={onClose} aria-label="Cerrar">×</button><div className="management-avatar profile-details-avatar">{(profile.full_name || profile.slug).slice(0, 2).toUpperCase()}</div><p className="eyebrow">Detalle del perfil</p><h2 id="profile-details-title">{profile.full_name || 'Sin nombre'}</h2><p className="profile-details-career">{profile.career || 'Carrera no indicada'}</p><div className="profile-details-grid"><span>Ruta pública<strong>/{profile.slug}</strong></span><span>Publicación<strong>{statusLabel}</strong></span><span>Cuenta<strong>{profile.is_active ? 'Activa' : 'Inactiva'}</strong></span><span>Actualizado<strong>{new Date(profile.updated_at).toLocaleDateString('es-MX')}</strong></span></div><div className="profile-details-actions"><a className="outline-button" href={`/${profile.slug}`} target="_blank">Ver perfil público <span>↗</span></a><button className="primary-button" onClick={onClose}>Cerrar</button></div></section></div>
}

function AdminSettings() { return <div className="accounts-help"><p className="eyebrow">Configuración general</p><h2>Plataforma EProfile</h2><p>La URL pública se construye con el slug permanente de cada estudiante. El contenido publicado es visible sin iniciar sesión.</p><div className="settings-note"><strong>Estado del sistema</strong><span>Supabase conectado</span><span>Perfiles públicos activos</span><span>Storage de avatares configurado</span></div></div> }

async function getUserRole(userId: string): Promise<AppRole | null> {
  const { data } = await supabase.from('user_roles').select('role').eq('user_id', userId).single()
  return data?.role === 'student' || data?.role === 'platform_admin' ? data.role : null
}

function AdminLogin({ email, password, error, setEmail, setPassword, onLogin, onBack }: { email: string; password: string; error: string; setEmail: (value: string) => void; setPassword: (value: string) => void; onLogin: () => void; onBack: () => void }) {
  const [registerOpen, setRegisterOpen] = useState(false)
  return <div className="login-page"><div className="login-card"><button className="brand" onClick={onBack}><span className="brand-mark">e</span><span>EProfile</span></button>{registerOpen ? <RegisterForm onBack={() => setRegisterOpen(false)} /> : <><p className="eyebrow">Acceso a EProfile</p><h1>Tu espacio de<br /><em>gestión.</em></h1><p className="login-copy">Inicia sesión para administrar la plataforma o completar tu perfil.</p><form onSubmit={(event) => { event.preventDefault(); onLogin() }}><label>Correo electrónico<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="correo@ejemplo.com" required /></label><label>Contraseña<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" required /></label>{error && <p className="form-error">{error}</p>}<button className="primary-button login-button" type="submit">Entrar <span>↗</span></button></form><button className="create-account-button" onClick={() => setRegisterOpen(true)}>Crear cuenta de estudiante <span>↗</span></button></>}</div><div className="login-art"><span>EPROFILE / ACCESO</span><strong>Tu historia<br />merece un<br /><em>lugar.</em></strong><small>Gestiona, completa, publica.</small></div></div>
}

function RegisterForm({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [slug, setSlug] = useState('')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isCreated, setIsCreated] = useState(false)
  async function register(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setIsSaving(true); setError('')
    const { error: functionError } = await supabase.functions.invoke('register-student', { body: { email, password, slug } })
    if (functionError) setError(functionError.message)
    else setIsCreated(true)
    setIsSaving(false)
  }
  if (isCreated) return <div className="account-success"><span className="success-icon">✓</span><p className="eyebrow">Cuenta creada</p><h1>Tu espacio<br /><em>ya está listo.</em></h1><p className="login-copy">La cuenta fue creada correctamente. Ahora puedes iniciar sesión y completar tu EProfile.</p><button className="primary-button login-button" onClick={onBack}>Iniciar sesión <span>↗</span></button></div>
  return <><p className="eyebrow">Nueva cuenta</p><h1>Empieza tu<br /><em>historia.</em></h1><p className="login-copy">Crea tu cuenta de estudiante y completa tu EProfile.</p><form onSubmit={(event) => void register(event)}><label>Correo electrónico<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="tu-correo@ejemplo.com" required /></label><label>Contraseña<input type="password" minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Mínimo 6 caracteres" required /></label><label>Tu ruta pública<input value={slug} onChange={(event) => setSlug(event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))} placeholder="tu-nombre" required /></label>{error && <p className="form-error">{error}</p>}<button className="primary-button login-button" type="submit" disabled={isSaving}>{isSaving ? 'Creando...' : 'Crear cuenta'} <span>↗</span></button></form><button className="create-account-button" onClick={onBack}>← Volver a iniciar sesión</button></>
}

type StudentDraft = { education: string; experience: string; skills: string; projects: string; linkedin: string; github: string; phone: string; template: string }
const emptyDraft: StudentDraft = { education: '', experience: '', skills: '', projects: '', linkedin: '', github: '', phone: '', template: 'classic' }

function StudentPanel({ session, onLogout }: { session: NonNullable<AuthSession>; onLogout: () => void }) {
  const [profile, setProfile] = useState({ id: '', slug: '', full_name: '', career: '', bio: '', avatar_url: '', status: 'empty' })
  const [draft, setDraft] = useState<StudentDraft>(emptyDraft)
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    void Promise.all([
      supabase.from('profiles').select('id, slug, full_name, career, bio, avatar_url, status').eq('id', session.user.id).single(),
      supabase.from('profile_content').select('education, experience, skills, projects, contacts, cv_template').eq('profile_id', session.user.id).eq('version_status', 'draft').single(),
    ]).then(([profileResult, contentResult]) => {
      if (profileResult.error) setError(profileResult.error.message)
      if (contentResult.error) setError(contentResult.error.message)
      if (profileResult.data) setProfile({ ...profileResult.data, full_name: profileResult.data.full_name ?? '', career: profileResult.data.career ?? '', bio: profileResult.data.bio ?? '', avatar_url: profileResult.data.avatar_url ?? '' })
      if (contentResult.data) {
        const contacts = (contentResult.data.contacts ?? {}) as { linkedin?: string; github?: string; phone?: string }
        setDraft({ education: toLines(contentResult.data.education), experience: toLines(contentResult.data.experience), skills: toLines(contentResult.data.skills), projects: toProjects(contentResult.data.projects), linkedin: contacts.linkedin ?? '', github: contacts.github ?? '', phone: contacts.phone ?? '', template: contentResult.data.cv_template ?? 'classic' })
      }
      setIsLoading(false)
    })
  }, [session.user.id])

  async function save(status: 'draft' | 'published') {
    setMessage(''); setError('')
    if (status === 'published' && (!profile.full_name.trim() || !profile.career.trim())) { setError('Para publicar necesitas completar nombre y carrera.'); return }
    const profileUpdate = await supabase.from('profiles').update({ full_name: profile.full_name.trim(), career: profile.career.trim(), bio: profile.bio.trim(), status, updated_at: new Date().toISOString() }).eq('id', profile.id)
    const contentPayload = { profile_id: profile.id, version_status: status, education: toArray(draft.education), experience: toArray(draft.experience), skills: toArray(draft.skills), projects: toProjectArray(draft.projects), contacts: { email: session.user.email, linkedin: draft.linkedin.trim(), github: draft.github.trim(), phone: draft.phone.trim() }, cv_template: draft.template, updated_at: new Date().toISOString() }
    const contentUpdate = await supabase.from('profile_content').upsert(contentPayload, { onConflict: 'profile_id,version_status' })
    if (profileUpdate.error || contentUpdate.error) setError(profileUpdate.error?.message ?? contentUpdate.error?.message ?? 'No se pudo guardar la información.')
    else { setProfile((current) => ({ ...current, status })); setMessage(status === 'published' ? 'Tu EProfile ya está publicada.' : 'Borrador guardado correctamente.') }
  }

  async function uploadAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    setIsUploading(true); setError('')
    const extension = file.name.split('.').pop() ?? 'jpg'
    const path = `${session.user.id}/avatar-${Date.now()}.${extension}`
    const upload = await supabase.storage.from('avatars').upload(path, file, { upsert: true, contentType: file.type })
    if (upload.error) setError(`No se pudo subir la foto: ${upload.error.message}`)
    else {
      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      const profileUpdate = await supabase.from('profiles').update({ avatar_url: data.publicUrl }).eq('id', profile.id)
      if (profileUpdate.error) setError(`La foto se subió, pero no se pudo guardar en el perfil: ${profileUpdate.error.message}`)
      else { setProfile((current) => ({ ...current, avatar_url: `${data.publicUrl}?v=${Date.now()}` })); setMessage('Foto actualizada.') }
    }
    setIsUploading(false)
  }

  function downloadVCard() { const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:${profile.full_name}\nTITLE:${profile.career}\nEMAIL:${session.user.email}\nTEL:${draft.phone}\nURL:${window.location.origin}/${profile.slug}\nEND:VCARD`; const url = URL.createObjectURL(new Blob([vcard], { type: 'text/vcard' })); const link = document.createElement('a'); link.href = url; link.download = `${profile.slug}.vcf`; link.click(); URL.revokeObjectURL(url) }

  if (isLoading) return <div className="admin-loading">Cargando tu EProfile...</div>
  return <div className="student-page"><header className="student-header"><button className="brand" onClick={onLogout}><span className="brand-mark">e</span><span>EProfile</span></button><div className="student-header-actions"><button className="student-contact-button" onClick={downloadVCard}>Descargar mi contacto <span>↓</span></button><div className="student-user"><span>{session.user.email}</span><button onClick={onLogout}>Cerrar sesión</button></div></div></header><main className="student-content"><div className="student-welcome"><div><p className="eyebrow">Mi EProfile / {profile.slug}</p><h1>Construye tu<br /><em>presencia.</em></h1><p>Completa tu información, guarda un borrador y publica cuando estés listo.</p></div><span className={`profile-state state-${profile.status}`}>{profile.status === 'published' ? 'Publicado' : profile.status === 'draft' ? 'Borrador' : 'Perfil vacío'}</span></div><section className="student-editor"><div className="editor-heading"><div><p className="eyebrow">Información principal</p><h2>Tu presentación</h2></div><span className="editor-slug">eprofile.com/{profile.slug}</span></div><form onSubmit={(event) => { event.preventDefault(); void save('draft') }}><div className="avatar-editor"><div className="avatar-preview">{profile.avatar_url ? <img src={profile.avatar_url} alt="Foto de perfil" /> : <span>{profile.full_name ? profile.full_name.slice(0, 2).toUpperCase() : 'TU'}</span>}</div><div><strong>Fotografía de perfil</strong><p>Usa una imagen clara y profesional.</p><label className="file-button">{isUploading ? 'Subiendo...' : 'Cambiar foto'}<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => void uploadAvatar(event)} /></label></div></div><label>Nombre completo<input value={profile.full_name} onChange={(event) => setProfile({ ...profile, full_name: event.target.value })} placeholder="Tu nombre completo" /></label><label>Carrera o profesión<input value={profile.career} onChange={(event) => setProfile({ ...profile, career: event.target.value })} placeholder="Ej. Ingeniería de software" /></label><label>Reseña breve<textarea value={profile.bio} onChange={(event) => setProfile({ ...profile, bio: event.target.value })} placeholder="Cuéntale al mundo quién eres y qué haces." rows={4} /></label><div className="editor-two-columns"><label>Formación<textarea value={draft.education} onChange={(event) => setDraft({ ...draft, education: event.target.value })} placeholder="Una línea por estudio o certificación" rows={4} /></label><label>Experiencia<textarea value={draft.experience} onChange={(event) => setDraft({ ...draft, experience: event.target.value })} placeholder="Una línea por experiencia" rows={4} /></label></div><label>Habilidades<textarea value={draft.skills} onChange={(event) => setDraft({ ...draft, skills: event.target.value })} placeholder="React, SQL, comunicación..." rows={3} /></label><label>Proyectos<textarea value={draft.projects} onChange={(event) => setDraft({ ...draft, projects: event.target.value })} placeholder="Un proyecto por línea: Nombre | descripción | enlace opcional" rows={4} /></label><div className="editor-two-columns"><label>LinkedIn<input value={draft.linkedin} onChange={(event) => setDraft({ ...draft, linkedin: event.target.value })} placeholder="https://linkedin.com/in/..." /></label><label>GitHub<input value={draft.github} onChange={(event) => setDraft({ ...draft, github: event.target.value })} placeholder="https://github.com/..." /></label></div><label>Teléfono<input value={draft.phone} onChange={(event) => setDraft({ ...draft, phone: event.target.value })} placeholder="+52 ..." /></label><label>Plantilla del CV<select value={draft.template} onChange={(event) => setDraft({ ...draft, template: event.target.value })}><option value="classic">Clásica</option><option value="minimal">Minimalista</option><option value="creative">Creativa</option></select></label>{error && <p className="form-error">{error}</p>}{message && <p className="form-success">{message}</p>}<div className="editor-actions"><button className="outline-button" type="submit">Guardar borrador</button><button className="outline-button" type="button" onClick={() => setIsPreviewOpen(true)}>Previsualizar</button><button className="outline-button" type="button" onClick={() => window.print()}>Descargar CV</button><button className="primary-button" type="button" onClick={() => void save('published')}>Publicar perfil <span>↗</span></button></div></form></section>{isPreviewOpen && <PreviewModal profile={profile} draft={draft} onClose={() => setIsPreviewOpen(false)} />}</main></div>
}

function toArray(value: string) { return value.split('\n').map((item) => item.trim()).filter(Boolean) }
function toLines(value: unknown) { return Array.isArray(value) ? value.map(String).join('\n') : '' }
function toProjects(value: unknown) { return Array.isArray(value) ? value.map((item) => typeof item === 'string' ? item : `${item.name ?? ''} | ${item.description ?? ''} | ${item.url ?? ''}`).join('\n') : '' }
function toProjectArray(value: string) { return toArray(value).map((item) => { const [name = '', description = '', url = ''] = item.split('|').map((part) => part.trim()); return { name, description, url } }) }

function PreviewModal({ profile, draft, onClose }: { profile: { full_name: string; career: string; bio: string; avatar_url: string }; draft: StudentDraft; onClose: () => void }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section className="public-preview" role="dialog" aria-modal="true"><button className="modal-close" onClick={onClose} aria-label="Cerrar">×</button>{profile.avatar_url && <img src={profile.avatar_url} alt="" /> }<p className="eyebrow">Vista previa</p><h2>{profile.full_name || 'Tu nombre'}</h2><h3>{profile.career || 'Tu carrera o profesión'}</h3><p>{profile.bio || 'Tu reseña aparecerá aquí.'}</p>{draft.skills && <><p className="preview-label">Habilidades</p><p>{draft.skills}</p></>}<div className="preview-links">{draft.linkedin && <a href={draft.linkedin} target="_blank">LinkedIn ↗</a>}{draft.github && <a href={draft.github} target="_blank">GitHub ↗</a>}</div></section></div>
}

type StudentProfile = { id: string; slug: string; full_name: string | null; career: string | null; status: 'empty' | 'draft' | 'published'; updated_at: string; is_active?: boolean }

function Dashboard() {
  const [studentProfiles, setStudentProfiles] = useState<StudentProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedProfile, setSelectedProfile] = useState<StudentProfile | null>(null)

  async function loadProfiles() {
    setIsLoading(true)
    setLoadError('')
    const { data, error } = await supabase.from('profiles').select('id, slug, full_name, career, status, updated_at, is_active').order('updated_at', { ascending: false })
    if (error) setLoadError(error.message)
    else setStudentProfiles((data ?? []) as StudentProfile[])
    setIsLoading(false)
  }

  useEffect(() => { void loadProfiles() }, [])

  const publishedCount = studentProfiles.filter((profile) => profile.status === 'published').length
  const draftCount = studentProfiles.filter((profile) => profile.status === 'draft').length
  const emptyCount = studentProfiles.filter((profile) => profile.status === 'empty').length
  const completion = studentProfiles.length ? Math.round(((publishedCount + draftCount) / studentProfiles.length) * 100) : 0

  return <div className="dashboard"><div className="dashboard-intro"><p>Gestiona los perfiles guardados en Supabase.</p><button className="primary-button small" onClick={() => setIsModalOpen(true)}>+ Nuevo estudiante</button></div><div className="stats-grid"><Stat label="Perfiles publicados" value={String(publishedCount)} change="Datos reales" tone="coral" /><Stat label="En borrador" value={String(draftCount)} change="Datos reales" tone="yellow" /><Stat label="Perfiles vacíos" value={String(emptyCount)} change="Datos reales" tone="mint" /></div><div className="admin-grid"><section className="panel recent-panel"><div className="panel-heading"><div><p className="eyebrow">Base de datos</p><h2>Perfiles de estudiantes</h2></div><button className="more-button" onClick={() => void loadProfiles()}>Actualizar ↻</button></div>{loadError && <p className="form-error">No se pudieron cargar los perfiles: {loadError}</p>}{isLoading ? <p className="panel-message">Cargando perfiles...</p> : studentProfiles.length === 0 ? <p className="panel-message">Todavía no hay estudiantes registrados. Crea el primero con el botón “Nuevo estudiante”.</p> : <><div className="table-head"><span>ESTUDIANTE</span><span>ESTADO</span><span>ACTUALIZADO</span><span /></div>{studentProfiles.map((profile) => <StudentRow key={profile.id} profile={profile} onSelect={setSelectedProfile} />)}</>}</section><section className="panel completion-panel"><div className="panel-heading"><div><p className="eyebrow">Salud del contenido</p><h2>Completitud</h2></div><span className="circle-value">{completion}%</span></div><div className="progress-track"><span style={{ width: `${completion}%` }} /></div><p>{studentProfiles.length ? `Hay ${emptyCount} perfil${emptyCount === 1 ? '' : 'es'} que todavía necesita${emptyCount === 1 ? '' : 'n'} información.` : 'La completitud aparecerá cuando registres estudiantes.'}</p><button className="outline-button" onClick={() => void loadProfiles()}>Actualizar datos <span>↻</span></button><div className="mini-stats"><span><b>{publishedCount}</b> publicados</span><span><b>{emptyCount}</b> necesitan atención</span></div></section></div>{isModalOpen && <NewStudentModal onClose={() => setIsModalOpen(false)} onCreated={() => { setIsModalOpen(false); void loadProfiles() }} />}{selectedProfile && <ProfileDetailsModal profile={{ ...selectedProfile, is_active: selectedProfile.is_active ?? true }} onClose={() => setSelectedProfile(null)} />}</div>
}

function StudentRow({ profile, onSelect }: { profile: StudentProfile; onSelect?: (profile: StudentProfile) => void }) {
  const initials = (profile.full_name || profile.slug).split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()
  const tone = profile.status === 'published' ? 'peach' : profile.status === 'draft' ? 'blue' : 'mint'
  const statusLabel = profile.status === 'published' ? 'Publicado' : profile.status === 'draft' ? 'Borrador' : 'Vacío'
  return <div className="student-row" onClick={() => onSelect?.(profile)}><div className={`portrait portrait-tiny ${tone}`}>{initials}</div><div className="student-name"><strong>{profile.full_name || 'Sin nombre'}</strong><span>/{profile.slug}</span></div><span className={`status status-${tone}`}>{statusLabel}</span><span className="updated">{new Date(profile.updated_at).toLocaleDateString('es-MX')}</span><button className="row-arrow" aria-label={`Abrir ${profile.slug}`} onClick={(event) => { event.stopPropagation(); onSelect?.(profile) }}>↗</button></div>
}

function NewStudentModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [slug, setSlug] = useState('')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setIsSaving(true); setError('')
    const { error: functionError } = await supabase.functions.invoke('create-student', { body: { email, password, slug } })
    if (functionError) {
      setError(functionError.message.includes('Failed to send a request')
        ? 'La función create-student aún no está desplegada en Supabase. Despliega la función y vuelve a intentarlo.'
        : functionError.message)
    }
    else onCreated()
    setIsSaving(false)
  }
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section className="student-modal" role="dialog" aria-modal="true" aria-labelledby="new-student-title"><div className="modal-heading"><div><p className="eyebrow">Cuenta y perfil</p><h2 id="new-student-title">Nuevo estudiante</h2></div><button className="modal-close" onClick={onClose} aria-label="Cerrar">×</button></div><p className="modal-copy">Crea las credenciales y la ruta permanente. El estudiante completará el resto desde su panel.</p><form onSubmit={(event) => void submit(event)}><label>Correo electrónico<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="estudiante@ejemplo.com" required /></label><label>Contraseña temporal<input type="password" minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Mínimo 6 caracteres" required /></label><label>Ruta pública<input value={slug} onChange={(event) => setSlug(event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))} placeholder="ana-sofia" required /><small>Se publicará como eprofile.com/{slug || 'tu-ruta'}</small></label>{error && <p className="form-error">{error}</p>}<div className="modal-actions"><button type="button" className="outline-button" onClick={onClose}>Cancelar</button><button type="submit" className="primary-button" disabled={isSaving}>{isSaving ? 'Creando...' : 'Crear estudiante'} <span>↗</span></button></div></form></section></div>
}
function Stat({ label, value, change, tone }: { label: string; value: string; change: string; tone: string }) { return <article className={`stat-card ${tone}`}><div className="stat-icon">{tone === 'coral' ? '◌' : tone === 'yellow' ? '◷' : '↗'}</div><p>{label}</p><strong>{value}</strong><span>{change}</span></article> }
export default App
