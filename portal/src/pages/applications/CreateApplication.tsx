import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { applicationsApi, instancesApi, applicationComponentsApi } from '../../services/api'
import type { ApplicationCreate, InstanceCreate, ApplicationComponentCreate } from '../../types'
import {
  ApplicationForm,
  InstanceForm,
  ComponentForm,
  InfoCard,
  type ComponentFormData,
  getDefaultWebappSettings,
} from '../../components/applications'
import { Breadcrumbs } from '../../components/Breadcrumbs'

function CreateApplication() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Application form
  const [applicationData, setApplicationData] = useState<ApplicationCreate>({
    name: '',
    repository: '',
    enabled: true,
  })

  // Instance form
  const [instanceData, setInstanceData] = useState<Omit<InstanceCreate, 'application_uuid'>>({
    environment_uuid: '',
    image: '',
    version: '',
    enabled: true,
  })

  // Components
  const [components, setComponents] = useState<ComponentFormData[]>([])

  const addComponent = () => {
    setComponents([
      ...components,
      {
        name: '',
        type: 'webapp',
        url: null,
        is_public: false,
        enabled: true,
        settings: getDefaultWebappSettings(),
      },
    ])
  }

  const removeComponent = (index: number) => {
    setComponents(components.filter((_, i) => i !== index))
  }

  const updateComponent = (index: number, component: ComponentFormData) => {
    const updated = [...components]
    updated[index] = component
    setComponents(updated)
  }

  const createApplicationMutation = useMutation({
    mutationFn: applicationsApi.create,
  })

  const createInstanceMutation = useMutation({
    mutationFn: instancesApi.create,
  })

  const createComponentMutation = useMutation({
    mutationFn: applicationComponentsApi.create,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate application
    if (!applicationData.name) {
      setNotification({ type: 'error', message: 'Application name is required' })
      setTimeout(() => setNotification(null), 5000)
      return
    }

    // Validate instance
    if (!instanceData.environment_uuid || !instanceData.image || !instanceData.version) {
      setNotification({ type: 'error', message: 'Instance environment, image, and version are required' })
      setTimeout(() => setNotification(null), 5000)
      return
    }

    // Validate components
    if (components.length === 0) {
      setNotification({ type: 'error', message: 'At least one component is required' })
      setTimeout(() => setNotification(null), 5000)
      return
    }

    for (const component of components) {
      if (!component.name || !component.url || !component.settings) {
        setNotification({ type: 'error', message: 'All components must have name, URL, and settings' })
        setTimeout(() => setNotification(null), 5000)
        return
      }
    }

    try {
      // Step 1: Create application
      const application = await createApplicationMutation.mutateAsync(applicationData)

      // Step 2: Create instance
      const instance = await createInstanceMutation.mutateAsync({
        ...instanceData,
        application_uuid: application.uuid,
      })

      // Step 3: Create components
      const componentPromises = components.map((component) => {
        const componentData: ApplicationComponentCreate = {
          instance_uuid: instance.uuid,
          name: component.name,
          type: 'webapp',
          settings: component.settings,
          is_public: component.is_public,
          url: component.url,
          enabled: component.enabled,
        }
        return createComponentMutation.mutateAsync(componentData)
      })

      await Promise.all(componentPromises)

      setNotification({ type: 'success', message: 'Application, instance, and components created successfully!' })
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      queryClient.invalidateQueries({ queryKey: ['instances'] })
      queryClient.invalidateQueries({ queryKey: ['application-components'] })

      // Navigate to application detail after 2 seconds
      setTimeout(() => {
        navigate(`/applications/${application.uuid}`)
      }, 2000)
    } catch (error: any) {
      setNotification({
        type: 'error',
        message: error.response?.data?.detail || 'Error creating application',
      })
      setTimeout(() => setNotification(null), 5000)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumbs
          items={[
            { label: 'Applications', path: '/applications' },
            { label: 'New Application' },
          ]}
        />

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Create New Application</h1>
          <p className="text-slate-600">Create a new application with instance and components in one step</p>
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

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Application Section */}
          <ApplicationForm data={applicationData} onChange={setApplicationData} />

          {/* Instance Section */}
          <InstanceForm data={instanceData} onChange={setInstanceData} />

          {/* Components Section */}
          <div className="bg-white rounded-xl shadow-soft border border-slate-200/60 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-slate-800">Components</h2>
              <button
                type="button"
                onClick={addComponent}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-soft hover:shadow-soft-lg transition-all duration-200 text-sm font-medium"
              >
                <Plus size={18} />
                Add Component
              </button>
            </div>

            {/* Info Card */}
            <InfoCard>
              <p className="text-sm text-blue-900 leading-relaxed mb-2">
                Components are the building blocks of your application instance. Each component represents a specific service or workload that runs within the same container image and version. Available component types:
              </p>
              <ul className="text-sm text-blue-900 space-y-1.5 ml-4 list-disc">
                <li>
                  <strong>Webapp:</strong> A web application component that serves HTTP/HTTPS traffic. Requires a URL and can be configured with endpoints, healthchecks, environment variables, secrets, and resource limits (CPU, memory).
                </li>
                <li>
                  <strong>Worker:</strong> A background worker component that processes jobs or tasks asynchronously. Typically used for long-running background processes, queue processing, or scheduled tasks.
                </li>
                <li>
                  <strong>Cron:</strong> A scheduled job component that runs at specified intervals using cron syntax. Ideal for periodic maintenance tasks, data synchronization, or scheduled reports.
                </li>
              </ul>
            </InfoCard>

            {components.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <p>No components added yet. Click "Add Component" to get started.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {components.map((component, index) => (
                  <ComponentForm
                    key={index}
                    component={component}
                    onChange={(updatedComponent) => updateComponent(index, updatedComponent)}
                    onRemove={() => removeComponent(index)}
                    title={`Component ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => navigate('/applications')}
              className="px-6 py-2.5 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                createApplicationMutation.isPending ||
                createInstanceMutation.isPending ||
                createComponentMutation.isPending
              }
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-soft text-sm font-medium disabled:opacity-50"
            >
              {createApplicationMutation.isPending ||
              createInstanceMutation.isPending ||
              createComponentMutation.isPending
                ? 'Creating...'
                : 'Create Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateApplication

