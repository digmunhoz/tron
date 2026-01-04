import { useQuery } from '@tanstack/react-query'
import {
  Cloud,
  Globe,
  AppWindow,
  Server,
  Box,
} from 'lucide-react'
import { dashboardApi } from '../../services/api'
import { Breadcrumbs } from '../../components/Breadcrumbs'
import { PageHeader } from '../../components/PageHeader'
import { useAuth } from '../../contexts/AuthContext'
import {
  ComponentsOverview,
  StatsGrid,
  ComponentsByEnvironment,
  ComponentsByCluster,
} from '../../components/home'

function Home() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardApi.getOverview,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!dashboard) {
    return (
      <div className="space-y-6">
        <Breadcrumbs items={[{ label: 'Home', path: '/' }]} />
        <div className="text-center py-8 text-slate-500">
          <p>No data available</p>
        </div>
      </div>
    )
  }

  const stats = [
    ...(isAdmin ? [
      {
        label: 'Clusters',
        value: dashboard.clusters,
        icon: Cloud,
        path: '/clusters',
        bgColor: 'bg-blue-50',
        iconColor: 'text-blue-600',
        borderColor: 'border-blue-100'
      },
      {
        label: 'Environments',
        value: dashboard.environments,
        icon: Globe,
        path: '/environments',
        bgColor: 'bg-indigo-50',
        iconColor: 'text-indigo-600',
        borderColor: 'border-indigo-100'
      },
    ] : []),
    {
      label: 'Applications',
      value: dashboard.applications,
      icon: AppWindow,
      path: '/applications',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      borderColor: 'border-purple-100'
    },
    {
      label: 'Instances',
      value: dashboard.instances,
      icon: Server,
      path: '/applications',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      borderColor: 'border-green-100'
    },
    {
      label: 'Components',
      value: dashboard.components.total,
      icon: Box,
      path: '/applications',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
      borderColor: 'border-orange-100'
    },
  ]

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Home', path: '/' },
        ]}
      />

      <PageHeader title="Dashboard" description="Tron platform overview" />

      <ComponentsOverview components={dashboard.components} />

      <StatsGrid stats={stats} />

      <ComponentsByEnvironment componentsByEnvironment={dashboard.components_by_environment} />

      {isAdmin && (
        <ComponentsByCluster componentsByCluster={dashboard.components_by_cluster} />
      )}
    </div>
  )
}

export default Home

