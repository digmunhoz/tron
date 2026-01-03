import axios from 'axios'
import { API_BASE_URL } from '../config/api'
import type {
  Cluster,
  ClusterCreate,
  Environment,
  EnvironmentCreate,
  Namespace,
  NamespaceCreate,
  Workload,
  WorkloadCreate,
  Application,
  ApplicationCreate,
  WebappDeploy,
  WebappDeployCreate,
  Template,
  TemplateCreate,
  TemplateUpdate,
  ComponentTemplateConfig,
  ComponentTemplateConfigCreate,
  ComponentTemplateConfigUpdate,
  ApplicationComponent,
  ApplicationComponentCreate,
  Instance,
  InstanceCreate,
} from '../types'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Clusters
export const clustersApi = {
  list: async (): Promise<Cluster[]> => {
    const response = await api.get<Cluster[]>('/clusters/')
    return response.data
  },
  get: async (uuid: string): Promise<Cluster> => {
    const response = await api.get<Cluster>(`/clusters/${uuid}`)
    return response.data
  },
  create: async (data: ClusterCreate): Promise<Cluster> => {
    const response = await api.post<Cluster>('/clusters/', data)
    return response.data
  },
  update: async (uuid: string, data: Partial<ClusterCreate>): Promise<Cluster> => {
    const response = await api.put<Cluster>(`/clusters/${uuid}`, data)
    return response.data
  },
  delete: async (uuid: string): Promise<void> => {
    await api.delete(`/clusters/${uuid}`)
  },
}

// Environments
export const environmentsApi = {
  list: async (): Promise<Environment[]> => {
    const response = await api.get<Environment[]>('/environments/')
    return response.data
  },
  get: async (uuid: string): Promise<Environment> => {
    const response = await api.get<Environment>(`/environments/${uuid}`)
    return response.data
  },
  create: async (data: EnvironmentCreate): Promise<Environment> => {
    const response = await api.post<Environment>('/environments/', data)
    return response.data
  },
  update: async (uuid: string, data: Partial<EnvironmentCreate>): Promise<Environment> => {
    const response = await api.put<Environment>(`/environments/${uuid}`, data)
    return response.data
  },
  delete: async (uuid: string): Promise<void> => {
    await api.delete(`/environments/${uuid}`)
  },
}

// Namespaces
export const namespacesApi = {
  list: async (): Promise<Namespace[]> => {
    const response = await api.get<Namespace[]>('/namespaces/')
    return response.data
  },
  get: async (uuid: string): Promise<Namespace> => {
    const response = await api.get<Namespace>(`/namespaces/${uuid}`)
    return response.data
  },
  create: async (data: NamespaceCreate): Promise<Namespace> => {
    const response = await api.post<Namespace>('/namespaces/', data)
    return response.data
  },
  update: async (uuid: string, data: Partial<NamespaceCreate>): Promise<Namespace> => {
    const response = await api.put<Namespace>(`/namespaces/${uuid}`, data)
    return response.data
  },
  delete: async (uuid: string): Promise<void> => {
    await api.delete(`/namespaces/${uuid}`)
  },
}

// Workloads
export const workloadsApi = {
  list: async (): Promise<Workload[]> => {
    const response = await api.get<Workload[]>('/workloads/')
    return response.data
  },
  get: async (uuid: string): Promise<Workload> => {
    const response = await api.get<Workload>(`/workloads/${uuid}`)
    return response.data
  },
  create: async (data: WorkloadCreate): Promise<Workload> => {
    const response = await api.post<Workload>('/workloads/', data)
    return response.data
  },
  update: async (uuid: string, data: Partial<WorkloadCreate>): Promise<Workload> => {
    const response = await api.put<Workload>(`/workloads/${uuid}`, data)
    return response.data
  },
  delete: async (uuid: string): Promise<void> => {
    await api.delete(`/workloads/${uuid}`)
  },
}

// Applications
export const applicationsApi = {
  list: async (): Promise<Application[]> => {
    const response = await api.get<Application[]>('/applications/')
    return response.data
  },
  get: async (uuid: string): Promise<Application> => {
    const response = await api.get<Application>(`/applications/${uuid}`)
    return response.data
  },
  create: async (data: ApplicationCreate): Promise<Application> => {
    const response = await api.post<Application>('/applications/', data)
    return response.data
  },
  update: async (uuid: string, data: Partial<ApplicationCreate>): Promise<Application> => {
    const response = await api.put<Application>(`/applications/${uuid}`, data)
    return response.data
  },
  delete: async (uuid: string): Promise<void> => {
    await api.delete(`/applications/${uuid}`)
  },
}

// Webapp Deploys
export const webappDeploysApi = {
  list: async (): Promise<WebappDeploy[]> => {
    const response = await api.get<WebappDeploy[]>('/webapps/deploys/')
    return response.data
  },
  get: async (uuid: string): Promise<WebappDeploy> => {
    const response = await api.get<WebappDeploy>(`/webapps/deploys/${uuid}`)
    return response.data
  },
  create: async (data: WebappDeployCreate): Promise<WebappDeploy> => {
    const response = await api.post<WebappDeploy>('/webapps/deploys/', data)
    return response.data
  },
  update: async (uuid: string, data: Partial<WebappDeployCreate>): Promise<WebappDeploy> => {
    const response = await api.put<WebappDeploy>(`/webapps/deploys/${uuid}`, data)
    return response.data
  },
  delete: async (uuid: string): Promise<void> => {
    await api.delete(`/webapps/deploys/${uuid}`)
  },
}

// Templates
export const templatesApi = {
  list: async (category?: string): Promise<Template[]> => {
    const params = category ? { category } : {}
    const response = await api.get<Template[]>('/templates/', { params })
    return response.data
  },
  get: async (uuid: string): Promise<Template> => {
    const response = await api.get<Template>(`/templates/${uuid}`)
    return response.data
  },
  create: async (data: TemplateCreate): Promise<Template> => {
    const response = await api.post<Template>('/templates/', data)
    return response.data
  },
  update: async (uuid: string, data: TemplateUpdate): Promise<Template> => {
    const response = await api.put<Template>(`/templates/${uuid}`, data)
    return response.data
  },
  delete: async (uuid: string): Promise<void> => {
    await api.delete(`/templates/${uuid}`)
  },
}

// Component Template Configs
export const componentTemplateConfigsApi = {
  list: async (component_type?: string): Promise<ComponentTemplateConfig[]> => {
    const params = component_type ? { component_type } : {}
    const response = await api.get<ComponentTemplateConfig[]>('/component-template-configs/', { params })
    return response.data
  },
  get: async (uuid: string): Promise<ComponentTemplateConfig> => {
    const response = await api.get<ComponentTemplateConfig>(`/component-template-configs/${uuid}`)
    return response.data
  },
  create: async (data: ComponentTemplateConfigCreate): Promise<ComponentTemplateConfig> => {
    const response = await api.post<ComponentTemplateConfig>('/component-template-configs/', data)
    return response.data
  },
  update: async (uuid: string, data: ComponentTemplateConfigUpdate): Promise<ComponentTemplateConfig> => {
    const response = await api.put<ComponentTemplateConfig>(`/component-template-configs/${uuid}`, data)
    return response.data
  },
  delete: async (uuid: string): Promise<void> => {
    await api.delete(`/component-template-configs/${uuid}`)
  },
  getTemplatesForComponent: async (component_type: string): Promise<any[]> => {
    const response = await api.get(`/component-template-configs/component/${component_type}/templates`)
    return response.data
  },
}

// Application Components - Webapp specific
export const applicationComponentsApi = {
  list: async (): Promise<ApplicationComponent[]> => {
    const response = await api.get<ApplicationComponent[]>('/application_components/webapp/')
    return response.data
  },
  get: async (uuid: string): Promise<ApplicationComponent> => {
    const response = await api.get<ApplicationComponent>(`/application_components/webapp/${uuid}`)
    return response.data
  },
  create: async (data: ApplicationComponentCreate): Promise<ApplicationComponent> => {
    // Only webapp type is supported for now
    if (data.type && data.type !== 'webapp') {
      throw new Error(`Component type ${data.type} is not yet supported. Only 'webapp' is available.`)
    }
    const response = await api.post<ApplicationComponent>('/application_components/webapp/', data)
    return response.data
  },
  update: async (uuid: string, data: Partial<ApplicationComponentCreate>): Promise<ApplicationComponent> => {
    const response = await api.put<ApplicationComponent>(`/application_components/webapp/${uuid}`, data)
    return response.data
  },
  delete: async (uuid: string): Promise<void> => {
    await api.delete(`/application_components/webapp/${uuid}`)
  },
}

// Instances
export const instancesApi = {
  list: async (): Promise<Instance[]> => {
    const response = await api.get<Instance[]>('/instances/')
    return response.data
  },
  get: async (uuid: string): Promise<Instance> => {
    const response = await api.get<Instance>(`/instances/${uuid}`)
    return response.data
  },
  create: async (data: InstanceCreate): Promise<Instance> => {
    const response = await api.post<Instance>('/instances/', data)
    return response.data
  },
  update: async (uuid: string, data: Partial<InstanceCreate>): Promise<Instance> => {
    const response = await api.put<Instance>(`/instances/${uuid}`, data)
    return response.data
  },
  delete: async (uuid: string): Promise<void> => {
    await api.delete(`/instances/${uuid}`)
  },
}

export default api

