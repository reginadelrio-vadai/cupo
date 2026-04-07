'use client'

import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'

export function ThemeToggle() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('cupo-theme')
    if (stored === 'dark') {
      setDark(true)
      document.documentElement.classList.add('dark')
    }
  }, [])

  function toggle() {
    const next = !dark
    setDark(next)
    document.documentElement.classList.add('theme-transition')
    if (next) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('cupo-theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('cupo-theme', 'light')
    }
    setTimeout(() => document.documentElement.classList.remove('theme-transition'), 250)
  }

  return (
    <button
      onClick={toggle}
      className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors duration-150 hover:bg-[var(--dash-hover)]"
      title={dark ? 'Modo claro' : 'Modo oscuro'}
    >
      {dark ? (
        <Sun className="h-4 w-4 text-[#F59E0B]" />
      ) : (
        <Moon className="h-4 w-4 text-[#64748B]" />
      )}
    </button>
  )
}
