export function CalendarSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 rounded-md bg-[#E2E8F0]" />
        <div className="flex gap-2">
          <div className="h-8 w-20 rounded-md bg-[#E2E8F0]" />
          <div className="h-8 w-20 rounded-md bg-[#E2E8F0]" />
          <div className="h-8 w-20 rounded-md bg-[#E2E8F0]" />
        </div>
      </div>
      <div className="h-[600px] rounded-[10px] border border-[#E2E8F0] bg-white" />
    </div>
  )
}
