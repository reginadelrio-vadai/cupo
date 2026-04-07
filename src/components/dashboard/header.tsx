import type { SessionUser } from '@/types'
import { ThemeToggle } from '@/components/shared/theme-toggle'

interface HeaderProps {
  user: SessionUser
  orgName: string
}

export function Header({ user, orgName }: HeaderProps) {
  const initials = (user.email?.[0] || 'U').toUpperCase()
  const today = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <header className="flex h-14 items-center justify-between border-b-[0.5px] px-6" style={{ borderColor: 'var(--dash-border)', backgroundColor: 'var(--dash-surface)' }}>
      <div className="flex items-center gap-3">
        <span className="text-[14px] font-medium" style={{ color: 'var(--dash-text)' }}>{orgName}</span>
        <div className="h-[14px] w-[0.5px]" style={{ backgroundColor: 'var(--dash-border)' }} />
        <span className="text-[12px] capitalize" style={{ color: 'var(--dash-text-muted)' }}>{today}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[13px] hidden md:block" style={{ color: 'var(--dash-text-muted)' }}>{user.email}</span>
        <ThemeToggle />
        <div className="p-[1.5px] rounded-[8px]" style={{ background: 'linear-gradient(135deg, #00B8E6, #06D6A0)' }}>
          <div className="flex h-8 w-8 items-center justify-center rounded-[7px] text-[11px] font-medium text-white" style={{ background: 'linear-gradient(135deg, #0891B2, #06D6A0)' }}>
            {initials}
          </div>
        </div>
      </div>
    </header>
  )
}
