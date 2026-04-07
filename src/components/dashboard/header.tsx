import type { SessionUser } from '@/types'

interface HeaderProps {
  user: SessionUser
  orgName: string
}

export function Header({ user, orgName }: HeaderProps) {
  const initials = (user.email?.[0] || 'U').toUpperCase()

  return (
    <header className="flex h-14 items-center justify-between border-b-[0.5px] border-[#E2E8F0] bg-white px-6">
      <div>
        <span className="text-sm font-medium text-[#0F172A]">{orgName}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-[#475569]">{user.email}</span>
        <div className="h-[1px] w-[14px] rotate-90 bg-[#E2E8F0]" />
        <div
          className="flex h-8 w-8 items-center justify-center rounded-[7px] text-xs font-medium text-white"
          style={{ background: 'linear-gradient(135deg, #0891B2, #06D6A0)' }}
        >
          {initials}
        </div>
      </div>
    </header>
  )
}
