import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Trash2, Plus, ArrowLeft, Pencil } from 'lucide-react'
import { applicationsApi, applicationComponentsApi, instancesApi, environmentsApi } from '../services/api'
import type { ApplicationComponentCreate, Instance, InstanceCreate } from '../types'
import DataTable from '../components/DataTable'

function ApplicationDetail() {
  const { uuid } = useParams<{ uuid: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isInstanceModalOpen, setIsInstanceModalOpen] = useState(false)
  const [isEditInstanceModalOpen, setIsEditInstanceModalOpen] = useState(false)
  const [editingInstance, setEditingInstance] = useState<Instance | null>(null)
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const { data: application, isLoading: isLoadingApp } = useQuery({
    queryKey: ['application', uuid],
    queryFn: () => applicationsApi.get(uuid!),
    enabled: !!uuid,
  })

  const { data: instances = [], isLoading: isLoadingInstances } = useQuery({
    queryKey: ['instances'],
    queryFn: instancesApi.list,
  })

  const { data: environments = [] } = useQuery({
    queryKey: ['environments'],
    queryFn: environmentsApi.list,
  })

  // Filter instances for this application
  const applicationInstances = instances.filter((instance) => instance.application.uuid === uuid)

  const [instanceFormData, setInstanceFormData] = useState<InstanceCreate>({
    application_uuid: uuid || '',
    environment_uuid: '',
    image: '',
    version: '',
    enabled: true,
  })

  const [editInstanceFormData, setEditInstanceFormData] = useState<{
    image: string
    version: string
  }>({
    image: '',
    version: '',
  })

  interface ComponentFormData {
    name: string
    type: 'webapp' | 'worker' | 'cron'
    url: string | null
    settings: Record<string, any> | null
  }

  const [components, setComponents] = useState<ComponentFormData[]>([])

  const addComponent = () => {
    setComponents([
      ...components,
      {
        name: '',
        type: 'webapp',
        url: null,
        settings: null,
      },
    ])
  }

  const removeComponent = (index: number) => {
    setComponents(components.filter((_, i) => i !== index))
  }

  const updateComponent = (index: number, field: keyof ComponentFormData, value: any) => {
    const updated = [...components]
    updated[index] = { ...updated[index], [field]: value }
    setComponents(updated)
  }

  const createInstanceMutation = useMutation({
    mutationFn: async (data: InstanceCreate) => {
      // First create the instance
      const instance = await instancesApi.create(data)

      // Then create the components
      if (components.length > 0 && application) {
        const selectedEnv = environments.find((env) => env.uuid === data.environment_uuid)
        const componentPromises = components.map((component) => {
                      const componentData: ApplicationComponentCreate = {
                        instance_uuid: instance.uuid,
                        name: component.name || `${application?.name}-${selectedEnv?.name || 'env'}-${component.type}`,
                        type: component.type,
                        settings: component.settings,
                        is_public: false,
                        url: component.type === 'webapp'
                          ? (component.url || (selectedEnv ? `${application.name}-${selectedEnv.name}-${component.type}.example.com` : null))
                          : null,
                        enabled: true,
                      }
          return applicationComponentsApi.create(componentData)
        })
        await Promise.all(componentPromises)
      }

      return instance
    },
    onSuccess: () => {
      setNotification({ type: 'success', message: 'Instance and components created successfully' })
      queryClient.invalidateQueries({ queryKey: ['instances'] })
      queryClient.invalidateQueries({ queryKey: ['application-components'] })
      setIsInstanceModalOpen(false)
      setInstanceFormData({
        application_uuid: uuid || '',
        environment_uuid: '',
        image: '',
        version: '',
        enabled: true,
      })
      setComponents([])
      setTimeout(() => setNotification(null), 5000)
    },
    onError: (error: any) => {
      setNotification({
        type: 'error',
        message: error.response?.data?.detail || 'Error creating instance',
      })
      setTimeout(() => setNotification(null), 5000)
    },
  })

  const deleteInstanceMutation = useMutation({
    mutationFn: instancesApi.delete,
    onSuccess: () => {
      setNotification({ type: 'success', message: 'Instance deleted successfully' })
      queryClient.invalidateQueries({ queryKey: ['instances'] })
      setTimeout(() => setNotification(null), 5000)
    },
    onError: (error: any) => {
      setNotification({
        type: 'error',
        message: error.response?.data?.detail || 'Error deleting instance',
      })
      setTimeout(() => setNotification(null), 5000)
    },
  })

  const updateInstanceMutation = useMutation({
    mutationFn: ({ uuid, data }: { uuid: string; data: Partial<InstanceCreate> }) =>
      instancesApi.update(uuid, data),
    onSuccess: () => {
      setNotification({ type: 'success', message: 'Instance updated successfully' })
      queryClient.invalidateQueries({ queryKey: ['instances'] })
      setIsEditInstanceModalOpen(false)
      setEditingInstance(null)
      setTimeout(() => setNotification(null), 5000)
    },
    onError: (error: any) => {
      setNotification({
        type: 'error',
        message: error.response?.data?.detail || 'Error updating instance',
      })
      setTimeout(() => setNotification(null), 5000)
    },
  })


  const handleInstanceSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!instanceFormData.environment_uuid || !instanceFormData.image || !instanceFormData.version) {
      setNotification({ type: 'error', message: 'All fields are required' })
      setTimeout(() => setNotification(null), 5000)
      return
    }
    createInstanceMutation.mutate(instanceFormData)
  }

  const getInitials = (name: string): string => {
    const words = name.trim().split(/\s+/)
    if (words.length === 0) return ''
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase()
    return (words[0][0] + words[words.length - 1][0]).toUpperCase()
  }

  const getColorFromName = (name: string): string => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-yellow-500',
      'bg-red-500',
      'bg-teal-500',
      'bg-orange-500',
      'bg-cyan-500',
    ]
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colors[Math.abs(hash) % colors.length]
  }

  if (isLoadingApp) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-200 border-t-blue-600"></div>
      </div>
    )
  }

  if (!application) {
    return <div>Application not found</div>
  }

  return (
    <div className="space-y-6">
      {notification && (
        <div
          className={`p-4 rounded-lg shadow-soft border ${
            notification.type === 'success'
              ? 'bg-green-50/80 text-green-700 border-green-200/60'
              : 'bg-red-50/80 text-red-700 border-red-200/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{notification.message}</span>
            <button onClick={() => setNotification(null)} className="hover:opacity-60 transition-opacity">
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/applications')}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="text-slate-600" size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full ${getColorFromName(application.name)} flex items-center justify-center text-white font-semibold text-lg`}>
              {getInitials(application.name)}
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-slate-800">{application.name}</h1>
              <p className="text-sm text-slate-500">{application.repository || 'No repository'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Instances Section */}
      <div className="space-y-4">
        <div className="flex justify-end">
          <button
            onClick={() => {
              setIsInstanceModalOpen(true)
              setComponents([])
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-soft hover:shadow-soft-lg transition-all duration-200 text-sm font-medium"
          >
            <Plus size={18} />
            New Instance
          </button>
        </div>

        <DataTable<Instance>
            columns={[
              {
                key: 'environment',
                label: 'Environment',
                render: (instance) => (
                  <div>
                    <div className="text-sm font-medium text-slate-800">{instance.environment.name}</div>
                    <small className="text-xs text-slate-500">{instance.environment.uuid}</small>
                  </div>
                ),
              },
              {
                key: 'image',
                label: 'Image',
                render: (instance) => <div className="text-sm text-slate-600">{instance.image}</div>,
              },
              {
                key: 'version',
                label: 'Version',
                render: (instance) => <div className="text-sm text-slate-600">{instance.version}</div>,
              },
              {
                key: 'components',
                label: 'Components',
                render: (instance) => (
                  <div className="text-sm text-slate-600">
                    <span className="font-medium">{instance.components?.length || 0}</span>
                    <span className="text-slate-400 ml-1">component{instance.components?.length !== 1 ? 's' : ''}</span>
                  </div>
                ),
              },
              {
                key: 'status',
                label: 'Status',
                render: (instance) => (
                  <div>
                    {instance.enabled ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Enabled
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Disabled
                      </span>
                    )}
                  </div>
                ),
              },
            ]}
            data={applicationInstances}
            isLoading={isLoadingInstances}
            emptyMessage="No instances found"
            loadingColor="blue"
            getRowKey={(instance) => instance.uuid}
            actions={(instance) => [
              {
                label: 'Edit',
                icon: <Pencil size={14} />,
                onClick: () => {
                  setEditingInstance(instance)
                  setEditInstanceFormData({
                    image: instance.image,
                    version: instance.version,
                  })
                  setIsEditInstanceModalOpen(true)
                },
                variant: 'default',
              },
              {
                label: 'Manage Components',
                icon: <Pencil size={14} />,
                onClick: () => {
                  navigate(`/applications/${uuid}/instances/${instance.uuid}/components`)
                },
                variant: 'default',
              },
              {
                label: 'Delete',
                icon: <Trash2 size={14} />,
                onClick: () => {
                  if (confirm('Are you sure you want to delete this instance?')) {
                    deleteInstanceMutation.mutate(instance.uuid)
                  }
                },
                variant: 'danger',
              },
            ]}
          />
      </div>

      {/* Instance Modal */}
      {isInstanceModalOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-soft-lg max-w-md w-full border border-slate-200/60 animate-zoom-in">
            <div className="flex items-center justify-between p-5 border-b border-slate-200/60 bg-slate-50/50">
              <h2 className="text-lg font-semibold text-slate-800">New Instance</h2>
              <button
                onClick={() => setIsInstanceModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-white rounded-md transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleInstanceSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Environment</label>
                <select
                  value={instanceFormData.environment_uuid}
                  onChange={(e) => setInstanceFormData({ ...instanceFormData, environment_uuid: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 transition-all text-sm"
                  required
                >
                  <option value="">Select environment</option>
                  {environments.map((env) => (
                    <option key={env.uuid} value={env.uuid}>
                      {env.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Image</label>
                <input
                  type="text"
                  value={instanceFormData.image}
                  onChange={(e) => setInstanceFormData({ ...instanceFormData, image: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 transition-all text-sm"
                  placeholder="nginx"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Version</label>
                <input
                  type="text"
                  value={instanceFormData.version}
                  onChange={(e) => setInstanceFormData({ ...instanceFormData, version: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 transition-all text-sm"
                  placeholder="latest"
                  required
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-slate-700">Components</label>
                  <button
                    type="button"
                    onClick={addComponent}
                    className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                  >
                    <Plus size={14} />
                    Add Component
                  </button>
                </div>
                <div className="space-y-3 mt-2">
                  {components.map((component, index) => (
                    <div key={index} className="p-3 border border-slate-200 rounded-lg bg-slate-50/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-700">Component {index + 1}</span>
                        <button
                          type="button"
                          onClick={() => removeComponent(index)}
                          className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Name</label>
                          <input
                            type="text"
                            value={component.name}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\s/g, '')
                              updateComponent(index, 'name', value)
                            }}
                            className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400"
                            placeholder="my-component"
                            required
                            pattern="[^\s]+"
                            title="Component name cannot contain spaces"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Type</label>
                          <select
                            value={component.type}
                            onChange={(e) => updateComponent(index, 'type', e.target.value as 'webapp' | 'worker' | 'cron')}
                            className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400"
                          >
                            <option value="webapp">Webapp</option>
                            <option value="worker">Worker</option>
                            <option value="cron">Cron</option>
                          </select>
                        </div>
                        {component.type === 'webapp' && (
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">URL</label>
                            <input
                              type="text"
                              value={component.url || ''}
                              onChange={(e) => updateComponent(index, 'url', e.target.value || null)}
                              className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400"
                              placeholder="myapp.example.com"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {components.length === 0 && (
                    <p className="text-xs text-slate-500 text-center py-2">No components added. Click "Add Component" to add one.</p>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setIsInstanceModalOpen(false)}
                  className="px-4 py-2 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createInstanceMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-soft text-sm font-medium disabled:opacity-50"
                >
                  {createInstanceMutation.isPending ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Instance Modal */}
      {isEditInstanceModalOpen && editingInstance && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-soft-lg max-w-md w-full border border-slate-200/60 animate-zoom-in">
            <div className="flex items-center justify-between p-5 border-b border-slate-200/60 bg-slate-50/50">
              <h2 className="text-lg font-semibold text-slate-800">Edit Instance</h2>
              <button
                onClick={() => {
                  setIsEditInstanceModalOpen(false)
                  setEditingInstance(null)
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-white rounded-md transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (editingInstance) {
                  updateInstanceMutation.mutate({
                    uuid: editingInstance.uuid,
                    data: {
                      application_uuid: editingInstance.application.uuid,
                      environment_uuid: editingInstance.environment.uuid,
                      image: editInstanceFormData.image,
                      version: editInstanceFormData.version,
                      enabled: editingInstance.enabled,
                    },
                  })
                }
              }}
              className="p-5 space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Environment</label>
                <input
                  type="text"
                  value={editingInstance.environment.name}
                  disabled
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-500 text-sm cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Image</label>
                <input
                  type="text"
                  value={editInstanceFormData.image}
                  onChange={(e) => setEditInstanceFormData({ ...editInstanceFormData, image: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 transition-all text-sm"
                  placeholder="nginx"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Version</label>
                <input
                  type="text"
                  value={editInstanceFormData.version}
                  onChange={(e) => setEditInstanceFormData({ ...editInstanceFormData, version: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 transition-all text-sm"
                  placeholder="latest"
                  required
                />
              </div>
              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditInstanceModalOpen(false)
                    setEditingInstance(null)
                  }}
                  className="px-4 py-2 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateInstanceMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-soft text-sm font-medium disabled:opacity-50"
                >
                  {updateInstanceMutation.isPending ? 'Updating...' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


    </div>
  )
}

export default ApplicationDetail

