'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Calendar,
  ClipboardList,
  Users,
  Briefcase,
  UserCog,
  CreditCard,
  Settings,
  LogOut,
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
    <aside className="flex h-screen w-[240px] flex-col border-r-[0.5px] border-[#E2E8F0] bg-white">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2 px-5">
        <div className="h-7 w-7 rounded-lg bg-[#00B8E6] flex items-center justify-center">
          <div className="h-1.5 w-1.5 rounded-full bg-[#060608]" />
        </div>
        <span className="text-base font-medium tracking-[0.5px] text-[#0F172A]">cupo</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-3 pt-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors duration-150',
                isActive
                  ? 'bg-[#00B8E6]/[0.06] text-[#0891B2]'
                  : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="border-t-[0.5px] border-[#E2E8F0] p-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-[#475569] transition-colors duration-150 hover:bg-[#F8FAFC] hover:text-[#0F172A]"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
