'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Search, Loader2 } from 'lucide-react'

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
          <h1 className="text-[28px] font-medium tracking-[-1px] text-[#0F172A]">Clientes</h1>
          <p className="mt-1 text-sm text-[#475569]">{clients.length} clientes registrados</p>
        </div>
      </div>

      <div className="mt-6 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
        <Input
          placeholder="Buscar por nombre, teléfono o email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="mt-4 rounded-[10px] border border-[#E2E8F0] bg-white overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-[#94A3B8]" /></div>
        ) : clients.length === 0 ? (
          <p className="text-sm text-[#94A3B8] text-center py-12">No hay clientes aún</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E2E8F0]">
                <th className="px-4 py-3 text-left text-[10px] uppercase tracking-[1px] text-[#94A3B8] font-normal">Nombre</th>
                <th className="px-4 py-3 text-left text-[10px] uppercase tracking-[1px] text-[#94A3B8] font-normal">Teléfono</th>
                <th className="px-4 py-3 text-left text-[10px] uppercase tracking-[1px] text-[#94A3B8] font-normal">Email</th>
                <th className="px-4 py-3 text-left text-[10px] uppercase tracking-[1px] text-[#94A3B8] font-normal">Fuente</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr
                  key={client.id}
                  onClick={() => router.push(`/clients/${client.id}`)}
                  className="border-b border-[#E2E8F0] last:border-0 hover:bg-[#F8FAFC] cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 text-[#0F172A] font-medium">{client.name}</td>
                  <td className="px-4 py-3 text-[#475569]">{client.phone || '—'}</td>
                  <td className="px-4 py-3 text-[#475569]">{client.email || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-[4px] bg-[#F8FAFC] px-2 py-0.5 text-[10px] text-[#94A3B8]">
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
