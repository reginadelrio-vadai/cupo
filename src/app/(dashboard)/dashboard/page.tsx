import { verifySession } from '@/lib/dal'

export default async function DashboardPage() {
  await verifySession()

  return (
    <div>
      <h1 className="text-[28px] font-medium tracking-[-1px] text-[#0F172A]">
        Dashboard
      </h1>
      <p className="mt-1 text-sm text-[#475569]">
        Bienvenido de vuelta
      </p>

      {/* Metric cards — placeholder for M14 */}
      <div className="mt-6 grid grid-cols-[1.5fr_1fr_1fr] gap-4">
        <div className="rounded-[10px] border border-[#E2E8F0] bg-white p-5">
          <p className="text-[10px] uppercase tracking-[1px] text-[#94A3B8]">Citas hoy</p>
          <p className="mt-2 text-[28px] font-medium tracking-[-1px] text-[#0F172A]">0</p>
        </div>
        <div className="rounded-[10px] border border-[#E2E8F0] bg-white p-5">
          <p className="text-[10px] uppercase tracking-[1px] text-[#94A3B8]">Esta semana</p>
          <p className="mt-2 text-[26px] font-medium tracking-[-1px] text-[#0F172A]">0</p>
        </div>
        <div className="rounded-[10px] border border-[#E2E8F0] bg-white p-5">
          <p className="text-[10px] uppercase tracking-[1px] text-[#94A3B8]">Clientes</p>
          <p className="mt-2 text-[26px] font-medium tracking-[-1px] text-[#0F172A]">0</p>
        </div>
      </div>
    </div>
  )
}
