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
        <main className="flex-1 overflow-y-auto bg-[#F8FAFC] p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
