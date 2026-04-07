'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Calendar, ClipboardList, Users,
  Briefcase, UserCog, CreditCard, Settings, LogOut,
} from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/calendar', label: 'Calendario', icon: Calendar },
  { href: '/appointments', label: 'Citas', icon: ClipboardList },
  { href: '/clients', label: 'Clientes', icon: Users },
  { href: '/services', label: 'Servicios', icon: Briefcase },
  { href: '/team', label: 'Equipo', icon: UserCog },
  { href: '/payments', label: 'Pagos', icon: CreditCard },
  { href: '/settings', label: 'Configuración', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="flex h-screen w-[232px] flex-col border-r-[0.5px]" style={{ backgroundColor: 'var(--dash-sidebar)', borderColor: 'var(--dash-border)' }}>
      <div className="flex h-16 items-center gap-2.5 px-5">
        <div className="h-7 w-7 rounded-lg bg-[#00B8E6] flex items-center justify-center">
          <div className="h-1.5 w-1.5 rounded-full bg-[#060608]" />
        </div>
        <span className="text-[15px] font-medium tracking-[0.5px]" style={{ color: 'var(--dash-text)' }}>cupo</span>
      </div>

      <nav className="flex-1 px-3 pt-1 space-y-px">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex items-center gap-3 rounded-lg px-3 py-[9px] text-[13px] font-normal transition-all duration-150',
                isActive ? 'text-[#0891B2]' : ''
              )}
              style={{
                backgroundColor: isActive ? 'var(--dash-nav-active)' : 'transparent',
                color: isActive ? '#0891B2' : 'var(--dash-text-muted)',
              }}
              onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.backgroundColor = 'var(--dash-hover)'; e.currentTarget.style.color = 'var(--dash-text)' } }}
              onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--dash-text-muted)' } }}
            >
              {isActive && <div className="absolute left-0 top-[6px] bottom-[6px] w-[2px] rounded-full bg-[#0891B2]" />}
              <item.icon className="h-[18px] w-[18px]" strokeWidth={isActive ? 2 : 1.5} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-3 border-t-[0.5px]" style={{ borderColor: 'var(--dash-border)' }}>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-[9px] text-[13px] font-normal transition-all duration-150"
          style={{ color: 'var(--dash-text-muted)' }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--dash-hover)'; e.currentTarget.style.color = 'var(--dash-text)' }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--dash-text-muted)' }}
        >
          <LogOut className="h-[18px] w-[18px]" strokeWidth={1.5} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
