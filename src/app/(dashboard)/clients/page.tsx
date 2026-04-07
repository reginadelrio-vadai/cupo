'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Loader2, Users } from 'lucide-react'

interface Client {
  id: string
  name: string
  phone: string | null
  email: string | null
  source: string
  created_at: string
}

export default function ClientsPage() {
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    params.set('sort', 'created_at')

    fetch(`/api/dashboard/clients?${params}`)
      .then(r => r.json())
      .then(data => { setClients(data.data?.clients || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [search])

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-medium tracking-[-1px]" style={{ color: 'var(--dash-text)' }}>Clientes</h1>
          <p className="mt-1 text-[13px]" style={{ color: 'var(--dash-text-muted)' }}>{clients.length} clientes registrados</p>
        </div>
      </div>

      <div className="mt-6 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--dash-text-muted)' }} />
        <input
          placeholder="Buscar por nombre, teléfono o email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-10 rounded-xl border-[0.5px] pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0891B2]/20 transition-colors"
          style={{ backgroundColor: 'var(--dash-surface)', borderColor: 'var(--dash-border)', color: 'var(--dash-text)' }}
        />
      </div>

      <div className="mt-4 rounded-xl border-[0.5px] overflow-hidden shadow-sm" style={{ backgroundColor: 'var(--dash-surface)', borderColor: 'var(--dash-border)' }}>
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin" style={{ color: 'var(--dash-text-muted)' }} /></div>
        ) : clients.length === 0 ? (
          <div className="text-center py-16">
            <Users className="h-8 w-8 mx-auto mb-3" style={{ color: 'var(--dash-text-muted)' }} />
            <p className="text-[13px]" style={{ color: 'var(--dash-text-muted)' }}>No hay clientes aún</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '0.5px solid var(--dash-border)' }}>
                {['Nombre', 'Teléfono', 'Email', 'Fuente'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] uppercase tracking-[1px] font-normal" style={{ color: 'var(--dash-text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr
                  key={client.id}
                  onClick={() => router.push(`/clients/${client.id}`)}
                  className="cursor-pointer transition-colors duration-150"
                  style={{ borderBottom: '0.5px solid var(--dash-border)' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--dash-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-[7px] flex items-center justify-center text-[11px] font-medium text-white flex-shrink-0" style={{ background: 'linear-gradient(135deg, #0891B2, #06D6A0)' }}>
                        {client.name[0]?.toUpperCase()}
                      </div>
                      <span className="font-medium" style={{ color: 'var(--dash-text)' }}>{client.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--dash-text-secondary)' }}>{client.phone || '—'}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--dash-text-secondary)' }}>{client.email || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-[4px] px-2 py-0.5 text-[10px]" style={{ backgroundColor: 'var(--dash-hover)', color: 'var(--dash-text-muted)' }}>
                      {client.source}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
