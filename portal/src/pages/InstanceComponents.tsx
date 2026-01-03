import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Trash2, Plus, ArrowLeft, Pencil, Search } from 'lucide-react'
import { applicationComponentsApi, instancesApi, applicationsApi } from '../services/api'
import type { ApplicationComponentCreate, InstanceComponent } from '../types'

function InstanceComponents() {
  const { uuid: applicationUuid, instanceUuid } = useParams<{ uuid: string; instanceUuid: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: instance, isLoading: isLoadingInstance } = useQuery({
    queryKey: ['instances', instanceUuid],
    queryFn: () => instancesApi.get(instanceUuid!),
    enabled: !!instanceUuid,
  })

  const { data: application } = useQuery({
    queryKey: ['application', applicationUuid],
    queryFn: () => applicationsApi.get(applicationUuid!),
    enabled: !!applicationUuid,
  })

  const [editingComponentUuid, setEditingComponentUuid] = useState<string | null>(null)
  const [componentSearchTerm, setComponentSearchTerm] = useState('')
  const [componentTypeFilter, setComponentTypeFilter] = useState<'all' | 'webapp' | 'worker' | 'cron'>('all')
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [isAddComponentsModalOpen, setIsAddComponentsModalOpen] = useState(false)

  interface WebappSettings {
    custom_metrics: {
      enabled: boolean
      path: string
      port: number
    }
    endpoints: Array<{
      source_protocol: 'http' | 'https' | 'tcp' | 'tls'
      source_port: number
      dest_protocol: 'http' | 'https' | 'tcp' | 'tls'
      dest_port: number
    }>
    envs: Array<{
      key: string
      value: string
    }>
    secrets: Array<{
      name: string
      key: string
    }>
    cpu_scaling_threshold: number
    memory_scaling_threshold: number
    healthcheck: {
      path: string
      protocol: 'http' | 'tcp'
      port: number
      timeout: number
      interval: number
      initial_interval: number
      failure_threshold: number
    }
    cpu: number
    memory: number
  }

  interface ComponentFormData {
    name: string
    type: 'webapp' | 'worker' | 'cron'
    url: string | null
    is_public: boolean
    enabled: boolean
    settings: WebappSettings | null
  }

  const [component, setComponent] = useState<ComponentFormData | null>(null)

  const getDefaultWebappSettings = (): WebappSettings => ({
    custom_metrics: {
      enabled: false,
      path: '/metrics',
      port: 8080,
    },
    endpoints: [
      {
        source_protocol: 'http',
        source_port: 80,
        dest_protocol: 'http',
        dest_port: 8080,
      },
    ],
    envs: [],
    secrets: [],
    cpu_scaling_threshold: 80,
    memory_scaling_threshold: 80,
    healthcheck: {
      path: '/healthcheck',
      protocol: 'http',
      port: 80,
      timeout: 3,
      interval: 15,
      initial_interval: 15,
      failure_threshold: 2,
    },
    cpu: 0.5,
    memory: 512,
  })

  const initializeComponent = () => {
    setEditingComponentUuid(null)
    setComponent({
      name: '',
      type: 'webapp',
      url: null,
      is_public: false,
      enabled: true,
      settings: getDefaultWebappSettings(),
    })
  }

  const loadComponentForEdit = (component: InstanceComponent) => {
    setEditingComponentUuid(component.uuid)
    setComponent({
      name: component.name,
      type: component.type as 'webapp' | 'worker' | 'cron',
      url: component.url,
      is_public: false, // TODO: get from component if available
      enabled: component.enabled,
      settings: (component.settings as WebappSettings) || getDefaultWebappSettings(),
    })
    setIsAddComponentsModalOpen(true)
  }

  const updateComponent = (field: keyof ComponentFormData, value: any) => {
    if (!component) return
    setComponent({ ...component, [field]: value })
  }

  const updateComponentMutation = useMutation({
    mutationFn: ({ uuid, data }: { uuid: string; data: Partial<ApplicationComponentCreate> }) =>
      applicationComponentsApi.update(uuid, data),
    onSuccess: () => {
      setNotification({ type: 'success', message: 'Component updated successfully' })
      queryClient.invalidateQueries({ queryKey: ['instances'] })
      queryClient.invalidateQueries({ queryKey: ['application-components'] })
      setEditingComponentUuid(null)
      setComponent(null)
      setIsAddComponentsModalOpen(false)
      setTimeout(() => setNotification(null), 5000)
    },
    onError: (error: any) => {
      setNotification({
        type: 'error',
        message: error.response?.data?.detail || 'Error updating component',
      })
      setTimeout(() => setNotification(null), 5000)
    },
  })

  const deleteComponentMutation = useMutation({
    mutationFn: applicationComponentsApi.delete,
    onSuccess: () => {
      setNotification({ type: 'success', message: 'Component deleted successfully' })
      queryClient.invalidateQueries({ queryKey: ['instances'] })
      queryClient.invalidateQueries({ queryKey: ['application-components'] })
      setTimeout(() => setNotification(null), 5000)
    },
    onError: (error: any) => {
      setNotification({
        type: 'error',
        message: error.response?.data?.detail || 'Error deleting component',
      })
      setTimeout(() => setNotification(null), 5000)
    },
  })

  const addComponentToInstanceMutation = useMutation({
    mutationFn: applicationComponentsApi.create,
    onSuccess: () => {
      setNotification({ type: 'success', message: 'Component added successfully' })
      queryClient.invalidateQueries({ queryKey: ['instances'] })
      queryClient.invalidateQueries({ queryKey: ['application-components'] })
      setComponent(null)
      setIsAddComponentsModalOpen(false)
      setTimeout(() => setNotification(null), 5000)
    },
    onError: (error: any) => {
      setNotification({
        type: 'error',
        message: error.response?.data?.detail || 'Error adding component',
      })
      setTimeout(() => setNotification(null), 5000)
    },
  })

  if (isLoadingInstance) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!instance) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-slate-600 mb-4">Instance not found</p>
          <button
            onClick={() => navigate(`/applications/${applicationUuid}`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  const filteredComponents = (instance.components || []).filter((component) => {
    const matchesSearch = component.name.toLowerCase().includes(componentSearchTerm.toLowerCase())
    const matchesType = componentTypeFilter === 'all' || component.type === componentTypeFilter
    return matchesSearch && matchesType
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(`/applications/${applicationUuid}`)}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Back to Application</span>
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Components</h1>
              <div className="flex items-center gap-4 text-sm text-slate-600">
                <div>
                  <span className="font-medium">Application:</span> {application?.name || 'N/A'}
                </div>
                <div>
                  <span className="font-medium">Environment:</span> {instance.environment.name}
                </div>
                <div>
                  <span className="font-medium">Image:</span> {instance.image}:{instance.version}
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                initializeComponent()
                setIsAddComponentsModalOpen(true)
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-soft hover:shadow-soft-lg transition-all duration-200 text-sm font-medium"
            >
              <Plus size={18} />
              Add Component
            </button>
          </div>
        </div>

        {/* Notification */}
        {notification && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              notification.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}
          >
            {notification.message}
          </div>
        )}

        {/* Search and Filter */}
        <div className="mb-6 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={componentSearchTerm}
              onChange={(e) => setComponentSearchTerm(e.target.value)}
              placeholder="Search components by name..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400"
            />
          </div>
          <select
            value={componentTypeFilter}
            onChange={(e) => setComponentTypeFilter(e.target.value as 'all' | 'webapp' | 'worker' | 'cron')}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400"
          >
            <option value="all">All Types</option>
            <option value="webapp">Webapp</option>
            <option value="worker">Worker</option>
            <option value="cron">Cron</option>
          </select>
        </div>

        {/* Components Grid */}
        {filteredComponents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredComponents.map((component) => (
              <div key={component.uuid} className="bg-white rounded-xl shadow-soft border border-slate-200/60 overflow-hidden hover:shadow-soft-lg transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-900 mb-1">{component.name}</h3>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                          {component.type}
                        </span>
                        {component.enabled ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Enabled
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Disabled
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => loadComponentForEdit(component)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit component"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this component?')) {
                            deleteComponentMutation.mutate(component.uuid)
                          }
                        }}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete component"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  {component.url && (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-slate-500 mb-1">URL</p>
                      <p className="text-sm text-slate-700">{component.url}</p>
                    </div>
                  )}

                  {component.settings && (
                    <div className="mb-4 space-y-2">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs font-medium text-slate-500 mb-1">CPU</p>
                          <p className="text-sm font-semibold text-slate-700">
                            {component.settings.cpu ? `${component.settings.cpu} cores` : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-500 mb-1">Memory</p>
                          <p className="text-sm font-semibold text-slate-700">
                            {component.settings.memory
                              ? `${component.settings.memory >= 1024 ? `${(component.settings.memory / 1024).toFixed(1)} GB` : `${component.settings.memory} MB`}`
                              : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t border-slate-200">
                    <p className="text-xs text-slate-400">UUID: {component.uuid}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Created: {new Date(component.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-soft border border-slate-200/60 p-12 text-center">
            <p className="text-slate-500 text-lg">No components found matching your search criteria.</p>
          </div>
        )}

        {/* Add Components Modal */}
        {isAddComponentsModalOpen && instance && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-soft-lg max-w-4xl w-full border border-slate-200/60 animate-zoom-in max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-5 border-b border-slate-200/60 bg-slate-50/50 sticky top-0 z-10">
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">
                    {editingComponentUuid ? 'Edit Component' : 'Add Component'} - {instance.environment.name}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">Image: {instance.image}:{instance.version}</p>
                </div>
                <button
                  onClick={() => {
                    setIsAddComponentsModalOpen(false)
                    setComponent(null)
                    setEditingComponentUuid(null)
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-white rounded-md transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <h3 className="text-sm font-medium text-slate-700 mb-3">
                  {editingComponentUuid ? 'Edit Component' : 'Add New Component'}
                </h3>

                <>
                  {component && (
                    <div className="p-4 border border-slate-200 rounded-lg bg-slate-50/50">
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Type</label>
                          <select
                            value={component.type}
                            onChange={(e) => {
                              const newType = e.target.value as 'webapp' | 'worker' | 'cron'
                              updateComponent('type', newType)
                              if (newType === 'webapp' && !component.settings) {
                                updateComponent('settings', getDefaultWebappSettings())
                              }
                            }}
                            className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400"
                          >
                            <option value="webapp">Webapp</option>
                            <option value="worker">Worker</option>
                            <option value="cron">Cron</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Name *</label>
                          <input
                            type="text"
                            value={component.name}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\s/g, '')
                              updateComponent('name', value)
                            }}
                            className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400"
                            placeholder="my-component"
                            required
                            pattern="[^\s]+"
                            title="Component name cannot contain spaces"
                          />
                        </div>
                      {component.type === 'webapp' && (
                        <>
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">URL *</label>
                            <input
                              type="text"
                              value={component.url || ''}
                              onChange={(e) => updateComponent('url', e.target.value || null)}
                              className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400"
                              placeholder="myapp.example.com"
                              required
                            />
                          </div>
                          <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
                              <input
                                type="checkbox"
                                checked={component.is_public}
                                onChange={(e) => updateComponent('is_public', e.target.checked)}
                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                              />
                              Public
                            </label>
                            <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
                              <input
                                type="checkbox"
                                checked={component.enabled}
                                onChange={(e) => updateComponent('enabled', e.target.checked)}
                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                              />
                              Enabled
                            </label>
                          </div>
                          {component.settings && (
                              <div className="mt-4 pt-4 border-t border-slate-200 space-y-4">
                                <h4 className="text-sm font-semibold text-slate-700">Settings</h4>

                                {/* CPU and Memory */}
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-2">
                                      CPU (cores) *: {component.settings.cpu}
                                    </label>
                                    <input
                                      type="range"
                                      min="0.1"
                                      max="8"
                                      step="0.1"
                                      value={component.settings.cpu}
                                      onChange={(e) => {
                                        const updated = { ...component.settings!, cpu: parseFloat(e.target.value) || 0.1 }
                                        updateComponent( 'settings', updated)
                                      }}
                                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                      required
                                    />
                                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                                      <span>0.1</span>
                                      <span>8</span>
                                    </div>
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-2">
                                      Memory (MB) *: {component.settings.memory}
                                    </label>
                                    <input
                                      type="range"
                                      min="128"
                                      max="16384"
                                      step="128"
                                      value={component.settings.memory}
                                      onChange={(e) => {
                                        const updated = { ...component.settings!, memory: parseInt(e.target.value) || 128 }
                                        updateComponent( 'settings', updated)
                                      }}
                                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                      required
                                    />
                                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                                      <span>128 MB</span>
                                      <span>16 GB</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Scaling Thresholds */}
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-2">
                                      CPU Scaling Threshold (%): {component.settings.cpu_scaling_threshold}
                                    </label>
                                    <input
                                      type="range"
                                      min="1"
                                      max="100"
                                      step="1"
                                      value={component.settings.cpu_scaling_threshold}
                                      onChange={(e) => {
                                        const updated = { ...component.settings!, cpu_scaling_threshold: parseInt(e.target.value) || 80 }
                                        updateComponent( 'settings', updated)
                                      }}
                                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                    />
                                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                                      <span>1%</span>
                                      <span>100%</span>
                                    </div>
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-2">
                                      Memory Scaling Threshold (%): {component.settings.memory_scaling_threshold}
                                    </label>
                                    <input
                                      type="range"
                                      min="1"
                                      max="100"
                                      step="1"
                                      value={component.settings.memory_scaling_threshold}
                                      onChange={(e) => {
                                        const updated = { ...component.settings!, memory_scaling_threshold: parseInt(e.target.value) || 80 }
                                        updateComponent( 'settings', updated)
                                      }}
                                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                    />
                                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                                      <span>1%</span>
                                      <span>100%</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Healthcheck */}
                                <div className="border border-slate-200 rounded-lg p-3 bg-white">
                                  <h5 className="text-xs font-semibold text-slate-700 mb-2">Healthcheck</h5>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <label className="block text-xs font-medium text-slate-600 mb-1">Protocol</label>
                                      <select
                                        value={component.settings.healthcheck.protocol}
                                        onChange={(e) => {
                                          const updated = { ...component.settings!, healthcheck: { ...component.settings!.healthcheck, protocol: e.target.value as 'http' | 'tcp' } }
                                          updateComponent( 'settings', updated)
                                        }}
                                        className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400"
                                      >
                                        <option value="http">HTTP</option>
                                        <option value="tcp">TCP</option>
                                      </select>
                                    </div>
                                    {component.settings.healthcheck.protocol === 'http' && (
                                      <div>
                                        <label className="block text-xs font-medium text-slate-600 mb-1">Path</label>
                                        <input
                                          type="text"
                                          value={component.settings.healthcheck.path}
                                          onChange={(e) => {
                                            const updated = { ...component.settings!, healthcheck: { ...component.settings!.healthcheck, path: e.target.value } }
                                            updateComponent( 'settings', updated)
                                          }}
                                          className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400"
                                        />
                                      </div>
                                    )}
                                    {component.settings.healthcheck.protocol === 'tcp' && (
                                      <div>
                                        <label className="block text-xs font-medium text-slate-600 mb-1">Port *</label>
                                        <input
                                          type="number"
                                          min="1"
                                          max="65535"
                                          value={component.settings.healthcheck.port}
                                          onChange={(e) => {
                                            const updated = { ...component.settings!, healthcheck: { ...component.settings!.healthcheck, port: parseInt(e.target.value) || 80 } }
                                            updateComponent( 'settings', updated)
                                          }}
                                          className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400"
                                          required
                                        />
                                      </div>
                                    )}
                                    <div>
                                      <label className="block text-xs font-medium text-slate-600 mb-1">Timeout (s)</label>
                                      <input
                                        type="number"
                                        min="1"
                                        value={component.settings.healthcheck.timeout}
                                        onChange={(e) => {
                                          const updated = { ...component.settings!, healthcheck: { ...component.settings!.healthcheck, timeout: parseInt(e.target.value) || 3 } }
                                          updateComponent( 'settings', updated)
                                        }}
                                        className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-medium text-slate-600 mb-1">Interval (s)</label>
                                      <input
                                        type="number"
                                        min="1"
                                        value={component.settings.healthcheck.interval}
                                        onChange={(e) => {
                                          const updated = { ...component.settings!, healthcheck: { ...component.settings!.healthcheck, interval: parseInt(e.target.value) || 15 } }
                                          updateComponent( 'settings', updated)
                                        }}
                                        className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-medium text-slate-600 mb-1">Initial Interval (s)</label>
                                      <input
                                        type="number"
                                        min="1"
                                        value={component.settings.healthcheck.initial_interval}
                                        onChange={(e) => {
                                          const updated = { ...component.settings!, healthcheck: { ...component.settings!.healthcheck, initial_interval: parseInt(e.target.value) || 15 } }
                                          updateComponent( 'settings', updated)
                                        }}
                                        className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-medium text-slate-600 mb-1">Failure Threshold</label>
                                      <input
                                        type="number"
                                        min="1"
                                        value={component.settings.healthcheck.failure_threshold}
                                        onChange={(e) => {
                                          const updated = { ...component.settings!, healthcheck: { ...component.settings!.healthcheck, failure_threshold: parseInt(e.target.value) || 2 } }
                                          updateComponent( 'settings', updated)
                                        }}
                                        className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400"
                                      />
                                    </div>
                                  </div>
                                </div>

                                {/* Endpoints */}
                                <div className="border border-slate-200 rounded-lg p-3 bg-white">
                                  <div className="flex items-center justify-between mb-2">
                                    <h5 className="text-xs font-semibold text-slate-700">Endpoints</h5>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updated = {
                                          ...component.settings!,
                                          endpoints: [
                                            ...component.settings!.endpoints,
                                            { source_protocol: 'http', source_port: 80, dest_protocol: 'http', dest_port: 8080 }
                                          ]
                                        }
                                        updateComponent( 'settings', updated)
                                      }}
                                      className="text-xs text-blue-600 hover:text-blue-700"
                                    >
                                      + Add
                                    </button>
                                  </div>
                                  {component.settings.endpoints.map((endpoint, epIndex) => (
                                    <div key={epIndex} className="mb-2 p-2 bg-slate-50 rounded border border-slate-200">
                                      <div className="grid grid-cols-4 gap-2">
                                        <div>
                                          <label className="block text-xs font-medium text-slate-600 mb-1">Source Protocol</label>
                                          <select
                                            value={endpoint.source_protocol}
                                            onChange={(e) => {
                                              const updated = { ...component.settings!, endpoints: component.settings!.endpoints.map((ep, i) => i === epIndex ? { ...ep, source_protocol: e.target.value as any } : ep) }
                                              updateComponent( 'settings', updated)
                                            }}
                                            className="w-full px-2 py-1 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400"
                                          >
                                            <option value="http">HTTP</option>
                                            <option value="https">HTTPS</option>
                                            <option value="tcp">TCP</option>
                                            <option value="tls">TLS</option>
                                          </select>
                                        </div>
                                        <div>
                                          <label className="block text-xs font-medium text-slate-600 mb-1">Source Port</label>
                                          <input
                                            type="number"
                                            min="1"
                                            max="65535"
                                            value={endpoint.source_port}
                                            onChange={(e) => {
                                              const updated = { ...component.settings!, endpoints: component.settings!.endpoints.map((ep, i) => i === epIndex ? { ...ep, source_port: parseInt(e.target.value) || 80 } : ep) }
                                              updateComponent( 'settings', updated)
                                            }}
                                            className="w-full px-2 py-1 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-xs font-medium text-slate-600 mb-1">Dest Protocol</label>
                                          <select
                                            value={endpoint.dest_protocol}
                                            onChange={(e) => {
                                              const updated = { ...component.settings!, endpoints: component.settings!.endpoints.map((ep, i) => i === epIndex ? { ...ep, dest_protocol: e.target.value as any } : ep) }
                                              updateComponent( 'settings', updated)
                                            }}
                                            className="w-full px-2 py-1 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400"
                                          >
                                            <option value="http">HTTP</option>
                                            <option value="https">HTTPS</option>
                                            <option value="tcp">TCP</option>
                                            <option value="tls">TLS</option>
                                          </select>
                                        </div>
                                        <div className="flex items-end gap-1">
                                          <div className="flex-1">
                                            <label className="block text-xs font-medium text-slate-600 mb-1">Dest Port</label>
                                            <input
                                              type="number"
                                              min="1"
                                              max="65535"
                                              value={endpoint.dest_port}
                                              onChange={(e) => {
                                                const updated = { ...component.settings!, endpoints: component.settings!.endpoints.map((ep, i) => i === epIndex ? { ...ep, dest_port: parseInt(e.target.value) || 8080 } : ep) }
                                                updateComponent( 'settings', updated)
                                              }}
                                              className="w-full px-2 py-1 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400"
                                            />
                                          </div>
                                          {component.settings && component.settings.endpoints.length > 1 && (
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const updated = { ...component.settings!, endpoints: component.settings!.endpoints.filter((_, i) => i !== epIndex) }
                                                updateComponent( 'settings', updated)
                                              }}
                                              className="px-2 py-1 text-red-600 hover:bg-red-50 rounded text-xs"
                                            >
                                              <X size={14} />
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                {/* Custom Metrics */}
                                <div className="border border-slate-200 rounded-lg p-3 bg-white">
                                  <div className="flex items-center justify-between mb-2">
                                    <h5 className="text-xs font-semibold text-slate-700">Custom Metrics</h5>
                                    <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
                                      <input
                                        type="checkbox"
                                        checked={component.settings.custom_metrics.enabled}
                                        onChange={(e) => {
                                          const updated = { ...component.settings!, custom_metrics: { ...component.settings!.custom_metrics, enabled: e.target.checked } }
                                          updateComponent( 'settings', updated)
                                        }}
                                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                      />
                                      Enabled
                                    </label>
                                  </div>
                                  {component.settings.custom_metrics.enabled && (
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        <label className="block text-xs font-medium text-slate-600 mb-1">Path</label>
                                        <input
                                          type="text"
                                          value={component.settings.custom_metrics.path}
                                          onChange={(e) => {
                                            const updated = { ...component.settings!, custom_metrics: { ...component.settings!.custom_metrics, path: e.target.value } }
                                            updateComponent( 'settings', updated)
                                          }}
                                          className="w-full px-2 py-1 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs font-medium text-slate-600 mb-1">Port</label>
                                        <input
                                          type="number"
                                          min="1"
                                          max="65535"
                                          value={component.settings.custom_metrics.port}
                                          onChange={(e) => {
                                            const updated = { ...component.settings!, custom_metrics: { ...component.settings!.custom_metrics, port: parseInt(e.target.value) || 8080 } }
                                            updateComponent( 'settings', updated)
                                          }}
                                          className="w-full px-2 py-1 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400"
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Environment Variables */}
                                <div className="border border-slate-200 rounded-lg p-3 bg-white">
                                  <div className="flex items-center justify-between mb-2">
                                    <h5 className="text-xs font-semibold text-slate-700">Environment Variables</h5>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updated = { ...component.settings!, envs: [...component.settings!.envs, { key: '', value: '' }] }
                                        updateComponent( 'settings', updated)
                                      }}
                                      className="text-xs text-blue-600 hover:text-blue-700"
                                    >
                                      + Add
                                    </button>
                                  </div>
                                  {component.settings.envs.map((env, envIndex) => (
                                    <div key={envIndex} className="mb-2 grid grid-cols-3 gap-2">
                                      <div>
                                        <input
                                          type="text"
                                          value={env.key}
                                          onChange={(e) => {
                                            const updated = { ...component.settings!, envs: component.settings!.envs.map((env, i) => i === envIndex ? { ...env, key: e.target.value } : env) }
                                            updateComponent( 'settings', updated)
                                          }}
                                          placeholder="Key"
                                          className="w-full px-2 py-1 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400"
                                        />
                                      </div>
                                      <div>
                                        <input
                                          type="text"
                                          value={env.value}
                                          onChange={(e) => {
                                            const updated = { ...component.settings!, envs: component.settings!.envs.map((env, i) => i === envIndex ? { ...env, value: e.target.value } : env) }
                                            updateComponent( 'settings', updated)
                                          }}
                                          placeholder="Value"
                                          className="w-full px-2 py-1 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400"
                                        />
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const updated = { ...component.settings!, envs: component.settings!.envs.filter((_, i) => i !== envIndex) }
                                          updateComponent( 'settings', updated)
                                        }}
                                        className="px-2 py-1 text-red-600 hover:bg-red-50 rounded text-xs"
                                      >
                                        <X size={14} />
                                      </button>
                                    </div>
                                  ))}
                                </div>

                                {/* Secrets */}
                                <div className="border border-slate-200 rounded-lg p-3 bg-white">
                                  <div className="flex items-center justify-between mb-2">
                                    <h5 className="text-xs font-semibold text-slate-700">Secrets</h5>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updated = { ...component.settings!, secrets: [...component.settings!.secrets, { name: '', key: '' }] }
                                        updateComponent( 'settings', updated)
                                      }}
                                      className="text-xs text-blue-600 hover:text-blue-700"
                                    >
                                      + Add
                                    </button>
                                  </div>
                                  {component.settings.secrets.map((secret, secretIndex) => (
                                    <div key={secretIndex} className="mb-2 grid grid-cols-3 gap-2">
                                      <div>
                                        <input
                                          type="text"
                                          value={secret.name}
                                          onChange={(e) => {
                                            const updated = { ...component.settings!, secrets: component.settings!.secrets.map((s, i) => i === secretIndex ? { ...s, name: e.target.value } : s) }
                                            updateComponent( 'settings', updated)
                                          }}
                                          placeholder="Name"
                                          className="w-full px-2 py-1 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400"
                                        />
                                      </div>
                                      <div>
                                        <input
                                          type="text"
                                          value={secret.key}
                                          onChange={(e) => {
                                            const updated = { ...component.settings!, secrets: component.settings!.secrets.map((s, i) => i === secretIndex ? { ...s, key: e.target.value } : s) }
                                            updateComponent( 'settings', updated)
                                          }}
                                          placeholder="Key"
                                          className="w-full px-2 py-1 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400"
                                        />
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const updated = { ...component.settings!, secrets: component.settings!.secrets.filter((_, i) => i !== secretIndex) }
                                          updateComponent( 'settings', updated)
                                        }}
                                        className="px-2 py-1 text-red-600 hover:bg-red-50 rounded text-xs"
                                      >
                                        <X size={14} />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                  {!component && (
                    <p className="text-sm text-slate-500 text-center py-4">Component form will appear here.</p>
                  )}
                </>
                <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddComponentsModalOpen(false)
                      setComponent(null)
                      setEditingComponentUuid(null)
                    }}
                    className="px-4 py-2 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium"
                  >
                    Cancel
                  </button>
                  {component && (
                    <button
                      type="button"
                      onClick={async () => {
                        if (!instance || !component) return

                        // Validate component before submitting
                        if (component.type !== 'webapp') {
                          setNotification({
                            type: 'error',
                            message: 'Only webapp components are supported at this time',
                          })
                          setTimeout(() => setNotification(null), 5000)
                          return
                        }

                        if (!component.name || !component.url || !component.settings) {
                          setNotification({
                            type: 'error',
                            message: 'Component is missing required fields (name, URL, and settings)',
                          })
                          setTimeout(() => setNotification(null), 5000)
                          return
                        }

                        if (editingComponentUuid) {
                          // Update existing component
                          const componentData: Partial<ApplicationComponentCreate> = {
                            name: component.name,
                            type: 'webapp',
                            settings: component.settings,
                            is_public: component.is_public,
                            url: component.url!,
                            enabled: component.enabled,
                          }
                          updateComponentMutation.mutate({ uuid: editingComponentUuid, data: componentData })
                        } else {
                          // Create new component
                          const componentData: ApplicationComponentCreate = {
                            instance_uuid: instance.uuid,
                            name: component.name,
                            type: 'webapp',
                            settings: component.settings,
                            is_public: component.is_public,
                            url: component.url!,
                            enabled: component.enabled,
                          }
                          addComponentToInstanceMutation.mutate(componentData)
                        }
                      }}
                      disabled={addComponentToInstanceMutation.isPending || updateComponentMutation.isPending}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-soft text-sm font-medium disabled:opacity-50"
                    >
                      {addComponentToInstanceMutation.isPending || updateComponentMutation.isPending
                        ? (editingComponentUuid ? 'Updating...' : 'Adding...')
                        : (editingComponentUuid ? 'Update Component' : 'Add Component')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default InstanceComponents

