'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Loader2, Plus, X, ChevronDown, ChevronRight } from 'lucide-react'
import { WEBHOOK_EVENTS } from '@/lib/constants'
import { toast } from 'sonner'
import { Toaster } from '@/components/ui/sonner'
import { format } from 'date-fns'

interface Endpoint { id: string; name: string; url: string; events: string[]; secret: string | null; is_active: boolean; created_at: string }
interface LogEntry { id: string; event_type: string; target_url: string; status: string; response_code: number | null; attempt_count: number; response_body: string | null; created_at: string }

export default function WebhooksPage() {
  const [endpoints, setEndpoints] = useState<Endpoint[]>([])
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [expandedLog, setExpandedLog] = useState<string | null>(null)
  const [logFilter, setLogFilter] = useState('')

  const fetchData = () => {
    Promise.all([
      fetch('/api/dashboard/webhooks').then(r => r.json()),
      fetch(`/api/dashboard/webhooks/logs${logFilter ? `?status=${logFilter}` : ''}`).then(r => r.json()),
    ]).then(([epData, logData]) => {
      setEndpoints(epData.data?.endpoints || [])
      setLogs(logData.data?.logs || [])
      setLoading(false)
    })
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchData() }, [logFilter])

  const toggleEndpoint = async (ep: Endpoint) => {
    await fetch(`/api/dashboard/webhooks/${ep.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !ep.is_active }),
    })
    fetchData()
  }

  const deleteEndpoint = async (id: string) => {
    await fetch(`/api/dashboard/webhooks/${id}`, { method: 'DELETE' })
    fetchData(); toast.success('Endpoint eliminado')
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-medium tracking-[-1px] text-[#0F172A]">Webhooks</h1>
          <p className="mt-1 text-sm text-[#475569]">Endpoints y registro de entregas</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="bg-[#00B8E6] text-[#060608] hover:opacity-80">
          <Plus className="h-4 w-4 mr-1" /> Agregar endpoint
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-[#94A3B8]" /></div>
      ) : (
        <>
          {/* Endpoints */}
          <div className="mt-6 space-y-2">
            {endpoints.map(ep => (
              <div key={ep.id} className="rounded-[10px] border border-[#E2E8F0] bg-white p-4">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-[#0F172A]">{ep.name}</p>
                      {ep.secret && <span className="text-[10px] text-[#10B981] bg-[#10B981]/[0.06] px-2 py-0.5 rounded">HMAC</span>}
                    </div>
                    <p className="text-xs text-[#94A3B8] mt-0.5 font-mono">{ep.url}</p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {ep.events.map(evt => (
                        <span key={evt} className="rounded bg-[#F8FAFC] px-1.5 py-0.5 text-[9px] text-[#94A3B8]">{evt}</span>
                      ))}
                    </div>
                  </div>
                  <Switch checked={ep.is_active} onCheckedChange={() => toggleEndpoint(ep)} />
                  <button onClick={() => deleteEndpoint(ep.id)} className="text-[#94A3B8] hover:text-[#EF4444] text-xs">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            {endpoints.length === 0 && <p className="text-sm text-[#94A3B8] text-center py-8">No hay endpoints configurados</p>}
          </div>

          {/* Logs */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] uppercase tracking-[1px] text-[#94A3B8]">Registro de entregas</p>
              <select value={logFilter} onChange={e => setLogFilter(e.target.value)}
                className="h-7 rounded border border-[#E2E8F0] px-2 text-xs text-[#475569]">
                <option value="">Todos</option>
                <option value="delivered">Entregados</option>
                <option value="failed">Fallidos</option>
              </select>
            </div>
            <div className="rounded-[10px] border border-[#E2E8F0] bg-white overflow-hidden">
              {logs.length === 0 ? (
                <p className="text-sm text-[#94A3B8] text-center py-8">Sin entregas aún</p>
              ) : (
                <div className="divide-y divide-[#E2E8F0]">
                  {logs.map(log => (
                    <div key={log.id}>
                      <button onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[#F8FAFC]">
                        {expandedLog === log.id ? <ChevronDown className="h-3 w-3 text-[#94A3B8]" /> : <ChevronRight className="h-3 w-3 text-[#94A3B8]" />}
                        <span className="text-xs text-[#475569] w-28">{format(new Date(log.created_at), 'dd/MM HH:mm:ss')}</span>
                        <span className="text-xs text-[#0F172A] flex-1 font-mono truncate">{log.event_type}</span>
                        <span className={`rounded-[4px] px-2 py-0.5 text-[10px] font-medium ${
                          log.status === 'delivered' ? 'bg-[#10B981]/[0.06] text-[#10B981]' : 'bg-[#EF4444]/[0.06] text-[#EF4444]'
                        }`}>{log.status}</span>
                        <span className="text-[10px] text-[#94A3B8] w-10 text-right">{log.response_code || '—'}</span>
                      </button>
                      {expandedLog === log.id && log.response_body && (
                        <div className="px-4 pb-3 pl-10">
                          <pre className="text-[10px] text-[#94A3B8] bg-[#F8FAFC] rounded p-2 overflow-x-auto max-h-24">
                            {log.response_body.slice(0, 500)}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {showModal && <WebhookModal onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); fetchData() }} />}
      <Toaster position="bottom-right" />
    </div>
  )
}

function WebhookModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [secret, setSecret] = useState('')
  const [events, setEvents] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  const toggleEvent = (evt: string) => setEvents(prev => prev.includes(evt) ? prev.filter(e => e !== evt) : [...prev, evt])

  const handleSave = async () => {
    if (!name || !url || !events.length) return
    setSaving(true)
    const res = await fetch('/api/dashboard/webhooks', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, url, events, secret: secret || null }),
    })
    setSaving(false)
    if (res.ok) { toast.success('Endpoint creado'); onSaved() }
    else { const d = await res.json(); toast.error(d.message || 'Error') }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="w-full max-w-[480px] rounded-[10px] border border-[#E2E8F0] bg-white shadow-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[#E2E8F0] px-5 py-4">
          <h3 className="text-base font-medium text-[#0F172A]">Nuevo webhook endpoint</h3>
          <button onClick={onClose} className="text-[#94A3B8] hover:text-[#0F172A]"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-4 px-5 py-4">
          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase tracking-[1.5px] text-[#94A3B8]">Nombre</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Mi webhook" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase tracking-[1.5px] text-[#94A3B8]">URL</Label>
            <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://example.com/webhook" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase tracking-[1.5px] text-[#94A3B8]">Secret HMAC (opcional)</Label>
            <Input value={secret} onChange={e => setSecret(e.target.value)} placeholder="whsec_..." />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase tracking-[1.5px] text-[#94A3B8]">Eventos</Label>
            <div className="flex flex-wrap gap-1.5">
              {WEBHOOK_EVENTS.map(evt => {
                const sel = events.includes(evt)
                return (
                  <button key={evt} onClick={() => toggleEvent(evt)}
                    className="rounded border px-2 py-1 text-[11px] transition-colors"
                    style={{ borderColor: sel ? '#0891B2' : '#E2E8F0', background: sel ? 'rgba(8,145,178,0.06)' : 'transparent', color: sel ? '#0891B2' : '#94A3B8' }}>
                    {evt}
                  </button>
                )
              })}
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving || !name || !url || !events.length} className="w-full bg-[#00B8E6] text-[#060608] hover:opacity-80">
            {saving ? 'Creando...' : 'Crear endpoint'}
          </Button>
        </div>
      </div>
    </div>
  )
}
