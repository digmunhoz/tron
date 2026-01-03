export interface Cluster {
  uuid: string
  name: string
  api_address: string
  environment_uuid: string
  environment?: Environment // Adicionado para incluir o objeto environment
  detail?: {
    status: string
    message?: {
      code: string
      message: string
    }
  }
  created_at: string
  updated_at: string
}

export interface ClusterCreate {
  name: string
  api_address: string
  token: string
  environment_uuid: string
}

export interface Environment {
  uuid: string
  name: string
  created_at: string
  updated_at: string
}

export interface EnvironmentCreate {
  name: string
}

export interface Namespace {
  uuid: string
  name: string
  created_at: string
  updated_at: string
}

export interface NamespaceCreate {
  name: string
}

export interface Workload {
  uuid: string
  name: string
  created_at: string
  updated_at: string
}

export interface WorkloadCreate {
  name: string
}

export interface Application {
  uuid: string
  name: string
  repository?: string | null
  enabled: boolean
  created_at: string
  updated_at: string
}

export interface ApplicationCreate {
  name: string
  repository?: string | null
  enabled?: boolean
}

export interface WebappDeploy {
  uuid: string
  webapp_uuid: string
  environment_uuid: string
  workload_uuid: string
  image: string
  version: string
  cpu: number
  memory: number
  cpu_scaling_threshold: number
  memory_scaling_threshold: number
  custom_metrics: Record<string, any>
  endpoints: Record<string, any>
  envs: Array<{ key: string; value: string }> | null
  secrets: Array<{ key: string; value: string }> | null
  healthcheck: Record<string, any>
  created_at: string
  updated_at: string
}

export interface WebappDeployCreate {
  webapp_uuid: string
  environment_uuid: string
  workload_uuid: string
  image: string
  version: string
  cpu: number
  memory: number
  cpu_scaling_threshold: number
  memory_scaling_threshold: number
  custom_metrics: Record<string, any>
  endpoints: Record<string, any>
  envs: Array<{ key: string; value: string }> | null
  secrets: Array<{ key: string; value: string }> | null
  healthcheck: Record<string, any>
}

export interface Template {
  uuid: string
  name: string
  description?: string
  category: string
  content: string
  variables_schema?: string
  created_at: string
  updated_at: string
}

export interface TemplateCreate {
  name: string
  description?: string
  category: string
  content: string
  variables_schema?: string
}

export interface TemplateUpdate {
  name?: string
  description?: string
  content?: string
  variables_schema?: string
}

export interface ComponentTemplateConfig {
  uuid: string
  component_type: string
  template_uuid: string
  render_order: number
  enabled: boolean
  template_name?: string
}

export interface ComponentTemplateConfigCreate {
  component_type: string
  template_uuid: string
  render_order: number
  enabled: boolean
}

export interface ComponentTemplateConfigUpdate {
  render_order?: number
  enabled?: boolean
}

export interface ApplicationComponent {
  uuid: string
  type: 'webapp' | 'worker' | 'cron'
  settings: Record<string, any> | null
  is_public: boolean
  url: string | null
  enabled: boolean
  created_at: string
  updated_at: string
}

export interface ApplicationComponentCreate {
  instance_uuid: string
  name: string
  type: 'webapp' | 'worker' | 'cron'
  settings?: Record<string, any> | null
  is_public?: boolean
  url?: string | null
  enabled?: boolean
}

export interface InstanceComponent {
  uuid: string
  name: string
  type: string
  settings: Record<string, any> | null
  url: string | null
  enabled: boolean
  created_at: string
  updated_at: string
}

export interface Instance {
  uuid: string
  application: Application
  environment: Environment
  components: InstanceComponent[]
  image: string
  version: string
  enabled: boolean
  created_at: string
  updated_at: string
}

export interface InstanceCreate {
  application_uuid: string
  environment_uuid: string
  image: string
  version: string
  enabled?: boolean
}

