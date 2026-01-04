import { Link } from 'react-router-dom'
import { LucideIcon } from 'lucide-react'

interface Stat {
  label: string
  value: number
  icon: LucideIcon
  path: string
  bgColor: string
  iconColor: string
  borderColor: string
}

interface StatsGridProps {
  stats: Stat[]
}

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Link
            key={stat.label}
            to={stat.path}
            className="group relative overflow-hidden rounded-xl bg-white border border-slate-200/60 shadow-soft hover:shadow-soft-lg transition-all duration-200 hover:-translate-y-0.5"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2.5 ${stat.bgColor} rounded-lg`}>
                  <Icon className={stat.iconColor} size={22} />
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                  {stat.label}
                </p>
                <p className="text-3xl font-semibold text-slate-800">
                  {stat.value}
                </p>
              </div>
            </div>

            {/* Subtle border on hover */}
            <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${stat.bgColor} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200`} />
          </Link>
        )
      })}
    </div>
  )
}

