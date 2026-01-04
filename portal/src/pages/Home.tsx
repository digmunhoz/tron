import { useQuery } from '@tanstack/react-query'
import {
  Cloud,
  Globe,
  AppWindow,
  TrendingUp,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { clustersApi, environmentsApi, applicationsApi } from '../services/api'
import { Breadcrumbs } from '../components/Breadcrumbs'
import { useAuth } from '../contexts/AuthContext'

function Home() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const { data: clusters = [] } = useQuery({
    queryKey: ['clusters'],
    queryFn: clustersApi.list,
    enabled: isAdmin, // Só busca se for admin
  })

  const { data: environments = [] } = useQuery({
    queryKey: ['environments'],
    queryFn: environmentsApi.list,
    enabled: isAdmin, // Só busca se for admin
  })

  const { data: applications = [] } = useQuery({
    queryKey: ['applications'],
    queryFn: applicationsApi.list,
  })

  const stats = [
    ...(isAdmin ? [
      {
        label: 'Clusters',
        value: clusters.length,
        icon: Cloud,
        path: '/clusters',
        bgColor: 'bg-blue-50',
        iconColor: 'text-blue-600',
        borderColor: 'border-blue-100'
      },
      {
        label: 'Environments',
        value: environments.length,
        icon: Globe,
        path: '/environments',
        bgColor: 'bg-indigo-50',
        iconColor: 'text-indigo-600',
        borderColor: 'border-indigo-100'
      },
    ] : []),
    {
      label: 'Applications',
      value: applications.length,
      icon: AppWindow,
      path: '/applications',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      borderColor: 'border-purple-100'
    },
  ]

  const totalItems = stats.reduce((sum, stat) => sum + stat.value, 0)

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Home', path: '/' },
        ]}
      />

      <div>
        <h1 className="text-3xl font-bold text-gradient">Dashboard</h1>
        <p className="text-neutral-600 mt-1">Visão geral da plataforma Tron</p>
      </div>

      {/* Summary Card */}
      <div className="bg-white rounded-xl p-6 shadow-soft border border-slate-200/60">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-1">
              Total de Recursos
            </p>
            <p className="text-4xl font-semibold text-slate-800">{totalItems}</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl">
            <TrendingUp className="text-blue-600" size={28} />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
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
    </div>
  )
}

export default Home
