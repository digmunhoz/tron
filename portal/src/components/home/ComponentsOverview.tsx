import type { ComponentStats } from '../../types'

interface ComponentsOverviewProps {
  components: ComponentStats
}

export function ComponentsOverview({ components }: ComponentsOverviewProps) {
  if (components.total === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-soft border border-slate-200/60">
      <h2 className="text-lg font-semibold text-slate-800 mb-4">Components Overview</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-100">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Webapp</p>
          <p className="text-2xl font-semibold text-slate-800">{components.webapp}</p>
        </div>
        <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-100">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Worker</p>
          <p className="text-2xl font-semibold text-slate-800">{components.worker}</p>
        </div>
        <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-100">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Cron</p>
          <p className="text-2xl font-semibold text-slate-800">{components.cron}</p>
        </div>
        <div className="text-center p-4 bg-green-50 rounded-lg border border-green-100">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Enabled</p>
          <p className="text-2xl font-semibold text-slate-800">{components.enabled}</p>
        </div>
      </div>
    </div>
  )
}

