export interface WebappSettings {
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
  command: string | null
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

export interface ComponentFormData {
  name: string
  type: 'webapp' | 'worker' | 'cron'
  url: string | null
  is_public: boolean
  enabled: boolean
  settings: WebappSettings | null
}

export const getDefaultWebappSettings = (): WebappSettings => ({
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
  command: null,
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

