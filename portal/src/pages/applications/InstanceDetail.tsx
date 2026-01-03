import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Trash2, Plus, Pencil, ChevronDown, ChevronRight, Eye } from 'lucide-react'
import { applicationComponentsApi, instancesApi, applicationsApi } from '../../services/api'
import type { ApplicationComponentCreate, InstanceComponent } from '../../types'
import { ComponentForm, type ComponentFormData, getDefaultWebappSettings } from '../../components/applications'
import { Breadcrumbs } from '../../components/Breadcrumbs'
import DataTable from '../../components/DataTable'

function InstanceDetail() {
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
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [isAddComponentsModalOpen, setIsAddComponentsModalOpen] = useState(false)
  const [isEditInstanceModalOpen, setIsEditInstanceModalOpen] = useState(false)
  const [expandedTypes, setExpandedTypes] = useState<Set<'webapp' | 'worker' | 'cron'>>(new Set(['webapp', 'worker', 'cron']))

  const [component, setComponent] = useState<ComponentFormData | null>(null)
  const [instanceFormData, setInstanceFormData] = useState<{
    image: string
    version: string
    enabled: boolean
  }>({
    image: '',
    version: '',
    enabled: true,
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

  const loadComponentForEdit = (componentData: InstanceComponent) => {
    setEditingComponentUuid(componentData.uuid)
    setComponent({
      name: componentData.name,
      type: componentData.type as 'webapp' | 'worker' | 'cron',
      url: componentData.url,
      is_public: false, // TODO: get from component if available
      enabled: componentData.enabled,
      settings: (componentData.settings as ComponentFormData['settings']) || getDefaultWebappSettings(),
    })
    setIsAddComponentsModalOpen(true)
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

  const updateInstanceMutation = useMutation({
    mutationFn: ({ uuid, data }: { uuid: string; data: Partial<{ image: string; version: string; enabled: boolean }> }) =>
      instancesApi.update(uuid, data),
    onSuccess: () => {
      setNotification({ type: 'success', message: 'Instance updated successfully' })
      queryClient.invalidateQueries({ queryKey: ['instances'] })
      setIsEditInstanceModalOpen(false)
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

  // Agrupar componentes por tipo (deve estar antes dos early returns)
  const componentsByType = useMemo(() => {
    const grouped: Record<'webapp' | 'worker' | 'cron', InstanceComponent[]> = {
      webapp: [],
      worker: [],
      cron: [],
    }
    ;(instance?.components || []).forEach((component) => {
      const type = component.type as 'webapp' | 'worker' | 'cron'
      if (grouped[type]) {
        grouped[type].push(component)
      }
    })
    return grouped
  }, [instance?.components])

  // Colunas base para todos os tipos
  const baseColumns = useMemo(() => [
    {
      key: 'name',
      label: 'Name',
      render: (component: InstanceComponent) => (
        <div>
          <div className="text-sm font-medium text-slate-800">{component.name}</div>
          <small className="text-xs text-slate-500">{component.uuid}</small>
        </div>
      ),
    },
    {
      key: 'url',
      label: 'URL',
      render: (component: InstanceComponent) => (
        <div className="text-sm text-slate-600">{component.url || '-'}</div>
      ),
    },
    {
      key: 'cpu',
      label: 'CPU',
      render: (component: InstanceComponent) => (
        <div className="text-sm text-slate-600">
          {component.settings?.cpu ? `${component.settings.cpu} cores` : 'N/A'}
        </div>
      ),
    },
    {
      key: 'memory',
      label: 'Memory',
      render: (component: InstanceComponent) => (
        <div className="text-sm text-slate-600">
          {component.settings?.memory
            ? `${component.settings.memory >= 1024 ? `${(component.settings.memory / 1024).toFixed(1)} GB` : `${component.settings.memory} MB`}`
            : 'N/A'}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (component: InstanceComponent) => (
        <div>
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
      ),
    },
  ], [])

  // Colunas específicas para webapp
  const webappColumns = useMemo(() => [
    {
      key: 'endpoints',
      label: 'Endpoints',
      render: (component: InstanceComponent) => {
        const endpoints = (component.settings as any)?.endpoints || []
        if (endpoints.length === 0) {
          return <div className="text-sm text-slate-400">No endpoints</div>
        }
        return (
          <div className="text-sm text-slate-600">
            {endpoints.map((endpoint: any, idx: number) => (
              <div key={idx} className="text-xs">
                {endpoint.source_protocol}:{endpoint.source_port} → {endpoint.dest_protocol}:{endpoint.dest_port}
              </div>
            ))}
          </div>
        )
      },
    },
    {
      key: 'visibility',
      label: 'Visibility',
      render: (component: InstanceComponent) => {
        const isPublic = (component as any).is_public ?? false
        return (
          <div>
            {isPublic ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Public
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                Private
              </span>
            )}
          </div>
        )
      },
    },
  ], [])

  // Função para obter colunas baseado no tipo
  const getColumnsForType = (componentType: 'webapp' | 'worker' | 'cron') => {
    if (componentType === 'webapp') {
      return [
        baseColumns[0], // name
        baseColumns[1], // url
        webappColumns[0], // endpoints
        webappColumns[1], // visibility
        baseColumns[2], // cpu
        baseColumns[3], // memory
        baseColumns[4], // status
      ]
    }
    return baseColumns
  }

  const toggleType = (type: 'webapp' | 'worker' | 'cron') => {
    setExpandedTypes((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(type)) {
        newSet.delete(type)
      } else {
        newSet.add(type)
      }
      return newSet
    })
  }

  const openEditInstanceModal = () => {
    if (instance) {
      setInstanceFormData({
        image: instance.image,
        version: instance.version,
        enabled: instance.enabled,
      })
      setIsEditInstanceModalOpen(true)
    }
  }

  // Early returns devem vir DEPOIS de todos os hooks
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
            onClick={() => navigate('/applications')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Applications', path: '/applications' },
          { label: application?.name || 'Application' },
          { label: instance.environment.name, path: `/applications/${applicationUuid}/instances/${instanceUuid}/components` },
          { label: 'Components' },
        ]}
      />

        {/* Header */}
        <div className="mb-8">
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
            <div className="flex items-center gap-3">
              <button
                onClick={openEditInstanceModal}
                className="flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 shadow-soft hover:shadow-soft-lg transition-all duration-200 text-sm font-medium"
              >
                <Pencil size={18} />
                Edit Instance
              </button>
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

        {/* Components by Type */}
        <div className="space-y-4">
          {(['webapp', 'worker', 'cron'] as const).map((type) => {
            const components = componentsByType[type]
            const isExpanded = expandedTypes.has(type)
            const count = components.length

            if (count === 0) return null

            return (
              <div key={type} className="bg-white rounded-xl shadow-soft border border-slate-200/60 overflow-hidden">
                <button
                  onClick={() => toggleType(type)}
                  className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown size={20} className="text-slate-600" />
                    ) : (
                      <ChevronRight size={20} className="text-slate-600" />
                    )}
                    <span className="text-lg font-semibold text-slate-800 capitalize">{type}</span>
                    <span className="text-sm text-slate-500">({count} component{count !== 1 ? 's' : ''})</span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-slate-200">
                    <DataTable<InstanceComponent>
                      columns={getColumnsForType(type)}
                      data={components}
                      isLoading={false}
                      emptyMessage="No components found"
                      loadingColor="blue"
                      getRowKey={(component) => component.uuid}
                      actions={(component) => {
                        const actions = []

                        // Adicionar "View" apenas para webapp
                        if (type === 'webapp') {
                          actions.push({
                            label: 'View',
                            icon: <Eye size={14} />,
                            onClick: () => navigate(`/applications/${applicationUuid}/instances/${instanceUuid}/components/${component.uuid}`),
                            variant: 'default' as const,
                          })
                        }

                        actions.push(
                          {
                            label: 'Edit',
                            icon: <Pencil size={14} />,
                            onClick: () => loadComponentForEdit(component),
                            variant: 'default' as const,
                          },
                          {
                            label: 'Delete',
                            icon: <Trash2 size={14} />,
                            onClick: () => {
                              if (confirm('Are you sure you want to delete this component?')) {
                                deleteComponentMutation.mutate(component.uuid)
                              }
                            },
                            variant: 'danger' as const,
                          }
                        )

                        return actions
                      }}
                    />
                  </div>
                )}
              </div>
            )
          })}

          {Object.values(componentsByType).every((components) => components.length === 0) && (
            <div className="bg-white rounded-xl shadow-soft border border-slate-200/60 p-12 text-center">
              <p className="text-slate-500 text-lg">No components found. Click "Add Component" to get started.</p>
            </div>
          )}
        </div>

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
              <div className="p-5">
                {component ? (
                  <ComponentForm
                    component={component}
                    onChange={setComponent}
                    showRemoveButton={false}
                    title={editingComponentUuid ? 'Edit Component' : 'Add Component'}
                  />
                ) : (
                  <p className="text-sm text-slate-500 text-center py-4">Component form will appear here.</p>
                )}
              </div>
              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-200 px-5 pb-5">
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
        )}

        {/* Edit Instance Modal */}
        {isEditInstanceModalOpen && instance && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-soft-lg max-w-2xl w-full border border-slate-200/60 animate-zoom-in">
              <div className="flex items-center justify-between p-5 border-b border-slate-200/60 bg-slate-50/50">
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">Edit Instance</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Application: {application?.name || 'N/A'} | Environment: {instance.environment.name}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsEditInstanceModalOpen(false)
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-white rounded-md transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Image <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={instanceFormData.image}
                    onChange={(e) => setInstanceFormData({ ...instanceFormData, image: e.target.value })}
                    placeholder="e.g., myapp"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Version <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={instanceFormData.version}
                    onChange={(e) => setInstanceFormData({ ...instanceFormData, version: e.target.value })}
                    placeholder="e.g., 1.0.0"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={instanceFormData.enabled}
                      onChange={(e) => setInstanceFormData({ ...instanceFormData, enabled: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-slate-700">Enabled</span>
                  </label>
                  <p className="text-xs text-slate-500 mt-1 ml-6">
                    When enabled, the instance will be active and can receive traffic.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-200 px-5 pb-5">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditInstanceModalOpen(false)
                  }}
                  className="px-4 py-2 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!instanceFormData.image || !instanceFormData.version) {
                      setNotification({
                        type: 'error',
                        message: 'Image and Version are required fields',
                      })
                      setTimeout(() => setNotification(null), 5000)
                      return
                    }

                    updateInstanceMutation.mutate({
                      uuid: instance.uuid,
                      data: {
                        image: instanceFormData.image,
                        version: instanceFormData.version,
                        enabled: instanceFormData.enabled,
                      },
                    })
                  }}
                  disabled={updateInstanceMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-soft text-sm font-medium disabled:opacity-50"
                >
                  {updateInstanceMutation.isPending ? 'Updating...' : 'Update Instance'}
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  )
}

export default InstanceDetail

