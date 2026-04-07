import { verifySession } from '@/lib/dal'
import { AnalyticsDashboard } from '@/components/dashboard/analytics-charts'

export default async function DashboardPage() {
  await verifySession()

  return (
    <div>
      <h1 className="text-[28px] font-medium tracking-[-1px] text-[#0F172A]">
        Dashboard
      </h1>
      <p className="mt-1 text-sm text-[#475569] mb-6">
        Bienvenido de vuelta
      </p>

      <AnalyticsDashboard />
    </div>
  )
}
