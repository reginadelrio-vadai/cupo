import { verifySession } from '@/lib/dal'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/dashboard/sidebar'
import { Header } from '@/components/dashboard/header'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await verifySession()

  if (!session.organizationId) {
    redirect('/onboarding')
  }

  const supabase = await createSupabaseServerClient()
  const { data: org } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', session.organizationId)
    .single()

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Gradient top bar */}
        <div
          className="h-[2px] w-full"
          style={{
            background: 'linear-gradient(90deg, #00B8E6 0%, #0891B2 30%, #06D6A0 60%, transparent 100%)',
          }}
        />
        <Header user={session} orgName={org?.name || 'Mi negocio'} />
        <main className="flex-1 overflow-y-auto p-6 relative overflow-x-hidden" style={{ backgroundColor: 'var(--dash-bg)' }}>
          {/* Ambient gradient blobs */}
          <div className="pointer-events-none absolute -top-20 -left-20 w-[600px] h-[500px]" style={{ background: 'radial-gradient(ellipse at 30% 20%, rgba(0,184,230,0.08), rgba(8,145,178,0.04) 40%, transparent 70%)' }} />
          <div className="pointer-events-none absolute -bottom-20 -right-20 w-[500px] h-[400px]" style={{ background: 'radial-gradient(ellipse at 70% 80%, rgba(6,214,160,0.06), rgba(16,185,129,0.03) 40%, transparent 70%)' }} />
          <div className="relative z-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
