'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Plus, X, Copy, Check, Key } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { Toaster } from '@/components/ui/sonner'

interface ApiKey { id: string; name: string; key_prefix: string; is_active: boolean; last_used_at: string | null; created_at: string }

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [newKeyRaw, setNewKeyRaw] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const fetchKeys = () => {
    fetch('/api/dashboard/api-keys').then(r => r.json()).then(d => {
      setKeys(d.data?.keys || [])
      setLoading(false)
    })
  }

  useEffect(() => { fetchKeys() }, [])

  const deleteKey = async (id: string) => {
    await fetch(`/api/dashboard/api-keys/${id}`, { method: 'DELETE' })
    fetchKeys()
    toast.success('API key eliminada')
  }

  const createKey = async (name: string) => {
    const res = await fetch('/api/dashboard/api-keys', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    const d = await res.json()
    if (res.ok) {
      setNewKeyRaw(d.data.raw_key)
      fetchKeys()
    } else {
      toast.error(d.message || 'Error')
    }
  }

  const copyKey = () => {
    if (newKeyRaw) {
      navigator.clipboard.writeText(newKeyRaw)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-medium tracking-[-1px] text-[#0F172A]">API Keys</h1>
          <p className="mt-1 text-sm text-[#475569]">Llaves para el agente de WhatsApp</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="bg-[#00B8E6] text-[#060608] hover:opacity-80">
          <Plus className="h-4 w-4 mr-1" /> Generar API key
        </Button>
      </div>

      {/* New key display (show once) */}
      {newKeyRaw && (
        <div className="mt-4 rounded-[10px] border border-[#F59E0B]/30 bg-[#F59E0B]/[0.04] p-4">
          <p className="text-xs text-[#D97706] font-medium mb-2">Guarda esta API key — no se puede ver de nuevo</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded bg-white border border-[#E2E8F0] px-3 py-2 text-sm font-mono text-[#0F172A] select-all">
              {newKeyRaw}
            </code>
            <Button size="sm" variant="outline" onClick={copyKey}>
              {copied ? <Check className="h-4 w-4 text-[#10B981]" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <Button size="sm" variant="outline" onClick={() => setNewKeyRaw(null)} className="mt-2 text-xs">
            Entendido, ya la guardé
          </Button>
        </div>
      )}

      <div className="mt-6 space-y-2">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-[#94A3B8]" /></div>
        ) : keys.length === 0 ? (
          <p className="text-sm text-[#94A3B8] text-center py-12">No hay API keys. Genera una para conectar el agente.</p>
        ) : keys.map(key => (
          <div key={key.id} className="flex items-center gap-3 rounded-[10px] border border-[#E2E8F0] bg-white p-4">
            <Key className="h-4 w-4 text-[#94A3B8]" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-[#0F172A]">{key.name}</p>
                <code className="text-[10px] text-[#94A3B8] font-mono">{key.key_prefix}...</code>
              </div>
              <p className="text-[11px] text-[#94A3B8]">
                Creada: {format(new Date(key.created_at), 'dd/MM/yyyy')}
                {key.last_used_at && ` · Último uso: ${format(new Date(key.last_used_at), 'dd/MM HH:mm')}`}
              </p>
            </div>
            <button onClick={() => deleteKey(key.id)} className="text-[#94A3B8] hover:text-[#EF4444]">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {showModal && <CreateKeyModal onClose={() => setShowModal(false)} onCreate={(name) => { createKey(name); setShowModal(false) }} />}
      <Toaster position="bottom-right" />
    </div>
  )
}

function CreateKeyModal({ onClose, onCreate }: { onClose: () => void; onCreate: (name: string) => void }) {
  const [name, setName] = useState('')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="w-full max-w-[400px] rounded-[10px] border border-[#E2E8F0] bg-white shadow-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[#E2E8F0] px-5 py-4">
          <h3 className="text-base font-medium text-[#0F172A]">Nueva API Key</h3>
          <button onClick={onClose} className="text-[#94A3B8] hover:text-[#0F172A]"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-4 px-5 py-4">
          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase tracking-[1.5px] text-[#94A3B8]">Nombre</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="WhatsApp Agent" />
          </div>
          <Button onClick={() => onCreate(name || 'Default')} className="w-full bg-[#00B8E6] text-[#060608] hover:opacity-80">
            Generar key
          </Button>
        </div>
      </div>
    </div>
  )
}
