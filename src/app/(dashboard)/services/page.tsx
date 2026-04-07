'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Loader2, Plus, X, Clock } from 'lucide-react'
import { DURATION_OPTIONS } from '@/lib/constants'
import { toast } from 'sonner'
import { Toaster } from '@/components/ui/sonner'

interface Service {
  id: string; name: string; description: string | null; duration_minutes: number
  buffer_after_minutes: number; price: number; currency: string
  requires_payment: boolean; is_virtual: boolean; is_active: boolean
  category_id: string | null; service_categories: { id: string; name: string } | null
}

interface Category { id: string; name: string }

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Service | null>(null)

  const fetchData = () => {
    Promise.all([
      fetch('/api/dashboard/services').then(r => r.json()),
      fetch('/api/dashboard/services/categories').then(r => r.json()),
    ]).then(([svcData, catData]) => {
      setServices(svcData.data?.services || [])
      setCategories(catData.data?.categories || [])
      setLoading(false)
    })
  }

  useEffect(() => { fetchData() }, [])

  const toggleActive = async (svc: Service) => {
    await fetch(`/api/dashboard/services/${svc.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !svc.is_active }),
    })
    fetchData()
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-medium tracking-[-1px] text-[#0F172A]">Servicios</h1>
          <p className="mt-1 text-sm text-[#475569]">{services.filter(s => s.is_active).length} activos</p>
        </div>
        <Button onClick={() => { setEditing(null); setShowModal(true) }} className="bg-[#00B8E6] text-[#060608] hover:opacity-80">
          <Plus className="h-4 w-4 mr-1" /> Agregar servicio
        </Button>
      </div>

      <div className="mt-6 space-y-2">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-[#94A3B8]" /></div>
        ) : services.length === 0 ? (
          <p className="text-sm text-[#94A3B8] text-center py-12">No hay servicios. Agrega tu primer servicio.</p>
        ) : (
          services.map((svc) => (
            <div
              key={svc.id}
              className="flex items-center gap-4 rounded-[10px] border border-[#E2E8F0] bg-white p-4 cursor-pointer hover:border-[#CBD5E1] transition-colors"
              onClick={() => { setEditing(svc); setShowModal(true) }}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-[#0F172A]">{svc.name}</p>
                  {!svc.is_active && <span className="text-[10px] text-[#94A3B8] bg-[#F8FAFC] px-2 py-0.5 rounded">Inactivo</span>}
                  {svc.is_virtual && <span className="text-[10px] text-[#0891B2] bg-[#0891B2]/[0.06] px-2 py-0.5 rounded">Virtual</span>}
                </div>
                <div className="mt-1 flex items-center gap-3 text-xs text-[#94A3B8]">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {svc.duration_minutes} min</span>
                  {svc.service_categories && <span>{String((svc.service_categories as Record<string, unknown>)?.name || '')}</span>}
                </div>
              </div>
              <p className="text-sm font-medium text-[#0891B2]">
                {svc.price > 0 ? `$${svc.price.toLocaleString()}` : 'Gratis'}
              </p>
              <div onClick={(e) => e.stopPropagation()}>
                <Switch checked={svc.is_active} onCheckedChange={() => toggleActive(svc)} />
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <ServiceModal
          service={editing}
          categories={categories}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); fetchData() }}
        />
      )}
      <Toaster position="bottom-right" />
    </div>
  )
}

function ServiceModal({ service, categories, onClose, onSaved }: {
  service: Service | null; categories: Category[]; onClose: () => void; onSaved: () => void
}) {
  const [name, setName] = useState(service?.name || '')
  const [description, setDescription] = useState(service?.description || '')
  const [duration, setDuration] = useState(service?.duration_minutes || 30)
  const [price, setPrice] = useState(String(service?.price || ''))
  const [buffer, setBuffer] = useState(String(service?.buffer_after_minutes || 0))
  const [categoryId, setCategoryId] = useState(service?.category_id || '')
  const [requiresPayment, setRequiresPayment] = useState(service?.requires_payment || false)
  const [isVirtual, setIsVirtual] = useState(service?.is_virtual || false)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)

    const body = {
      name: name.trim(), description: description.trim() || null,
      duration_minutes: duration, price: parseFloat(price) || 0,
      buffer_after_minutes: parseInt(buffer) || 0,
      category_id: categoryId || null, requires_payment: requiresPayment, is_virtual: isVirtual,
    }

    const url = service ? `/api/dashboard/services/${service.id}` : '/api/dashboard/services'
    const method = service ? 'PATCH' : 'POST'

    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    setSaving(false)

    if (res.ok) { toast.success(service ? 'Servicio actualizado' : 'Servicio creado'); onSaved() }
    else { const d = await res.json(); toast.error(d.message || 'Error') }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="w-full max-w-[480px] rounded-[10px] border border-[#E2E8F0] bg-white shadow-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[#E2E8F0] px-5 py-4">
          <h3 className="text-base font-medium text-[#0F172A]">{service ? 'Editar servicio' : 'Nuevo servicio'}</h3>
          <button onClick={onClose} className="text-[#94A3B8] hover:text-[#0F172A]"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-4 px-5 py-4">
          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase tracking-[1.5px] text-[#94A3B8]">Nombre</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Consulta general" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase tracking-[1.5px] text-[#94A3B8]">Descripción</Label>
            <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Opcional" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-[1.5px] text-[#94A3B8]">Duración</Label>
              <select value={duration} onChange={e => setDuration(parseInt(e.target.value))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                {DURATION_OPTIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-[1.5px] text-[#94A3B8]">Precio</Label>
              <Input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="0" min="0" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-[1.5px] text-[#94A3B8]">Buffer después (min)</Label>
              <Input type="number" value={buffer} onChange={e => setBuffer(e.target.value)} placeholder="0" min="0" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-[1.5px] text-[#94A3B8]">Categoría</Label>
              <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">Sin categoría</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex items-center justify-between py-2">
            <Label className="text-sm text-[#475569]">Requiere pago</Label>
            <Switch checked={requiresPayment} onCheckedChange={setRequiresPayment} />
          </div>
          <div className="flex items-center justify-between py-2">
            <Label className="text-sm text-[#475569]">Servicio virtual (Google Meet)</Label>
            <Switch checked={isVirtual} onCheckedChange={setIsVirtual} />
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full bg-[#00B8E6] text-[#060608] hover:opacity-80">
            {saving ? 'Guardando...' : service ? 'Guardar cambios' : 'Crear servicio'}
          </Button>
        </div>
      </div>
    </div>
  )
}
