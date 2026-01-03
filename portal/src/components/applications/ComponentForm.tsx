import { X } from 'lucide-react'
import type { ComponentFormData, WebappSettings } from './types'
import { getDefaultWebappSettings } from './types'

interface ComponentFormProps {
  component: ComponentFormData
  onChange: (component: ComponentFormData) => void
  onRemove?: () => void
  showRemoveButton?: boolean
  title?: string
}

export function ComponentForm({
  component,
  onChange,
  onRemove,
  showRemoveButton = true,
  title,
}: ComponentFormProps) {
  const updateField = (field: keyof ComponentFormData, value: any) => {
    onChange({ ...component, [field]: value })
  }

  const updateSettings = (field: keyof WebappSettings, value: any) => {
    if (!component.settings) {
      onChange({ ...component, settings: getDefaultWebappSettings() })
      return
    }
    onChange({ ...component, settings: { ...component.settings, [field]: value } })
  }

  return (
    <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-800">{title || 'Component'}</h3>
        {showRemoveButton && onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Type</label>
          <select
            value={component.type}
            onChange={(e) => {
              const newType = e.target.value as 'webapp' | 'worker' | 'cron'
              updateField('type', newType)
              if (newType === 'webapp' && !component.settings) {
                updateField('settings', getDefaultWebappSettings())
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
              updateField('name', value)
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
                onChange={(e) => updateField('url', e.target.value || null)}
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
                  onChange={(e) => updateField('is_public', e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                Public
              </label>
              <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
                <input
                  type="checkbox"
                  checked={component.enabled}
                  onChange={(e) => updateField('enabled', e.target.checked)}
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
                      onChange={(e) => updateSettings('cpu', parseFloat(e.target.value) || 0.1)}
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
                      onChange={(e) => updateSettings('memory', parseInt(e.target.value) || 128)}
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
                      onChange={(e) => updateSettings('cpu_scaling_threshold', parseInt(e.target.value) || 80)}
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
                      onChange={(e) => updateSettings('memory_scaling_threshold', parseInt(e.target.value) || 80)}
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
                          updateSettings('healthcheck', {
                            ...component.settings!.healthcheck,
                            protocol: e.target.value as 'http' | 'tcp',
                          })
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
                            updateSettings('healthcheck', {
                              ...component.settings!.healthcheck,
                              path: e.target.value,
                            })
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
                            updateSettings('healthcheck', {
                              ...component.settings!.healthcheck,
                              port: parseInt(e.target.value) || 80,
                            })
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
                          updateSettings('healthcheck', {
                            ...component.settings!.healthcheck,
                            timeout: parseInt(e.target.value) || 3,
                          })
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
                          updateSettings('healthcheck', {
                            ...component.settings!.healthcheck,
                            interval: parseInt(e.target.value) || 15,
                          })
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
                          updateSettings('healthcheck', {
                            ...component.settings!.healthcheck,
                            initial_interval: parseInt(e.target.value) || 15,
                          })
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
                          updateSettings('healthcheck', {
                            ...component.settings!.healthcheck,
                            failure_threshold: parseInt(e.target.value) || 2,
                          })
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
                        updateSettings('endpoints', [
                          ...component.settings!.endpoints,
                          { source_protocol: 'http', source_port: 80, dest_protocol: 'http', dest_port: 8080 },
                        ])
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
                              const updated = component.settings!.endpoints.map((ep, i) =>
                                i === epIndex ? { ...ep, source_protocol: e.target.value as any } : ep
                              )
                              updateSettings('endpoints', updated)
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
                              const updated = component.settings!.endpoints.map((ep, i) =>
                                i === epIndex ? { ...ep, source_port: parseInt(e.target.value) || 80 } : ep
                              )
                              updateSettings('endpoints', updated)
                            }}
                            className="w-full px-2 py-1 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Dest Protocol</label>
                          <select
                            value={endpoint.dest_protocol}
                            onChange={(e) => {
                              const updated = component.settings!.endpoints.map((ep, i) =>
                                i === epIndex ? { ...ep, dest_protocol: e.target.value as any } : ep
                              )
                              updateSettings('endpoints', updated)
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
                                const updated = component.settings!.endpoints.map((ep, i) =>
                                  i === epIndex ? { ...ep, dest_port: parseInt(e.target.value) || 8080 } : ep
                                )
                                updateSettings('endpoints', updated)
                              }}
                              className="w-full px-2 py-1 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400"
                            />
                          </div>
                          {component.settings && component.settings.endpoints.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                updateSettings(
                                  'endpoints',
                                  component.settings!.endpoints.filter((_, i) => i !== epIndex)
                                )
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
                          updateSettings('custom_metrics', {
                            ...component.settings!.custom_metrics,
                            enabled: e.target.checked,
                          })
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
                            updateSettings('custom_metrics', {
                              ...component.settings!.custom_metrics,
                              path: e.target.value,
                            })
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
                            updateSettings('custom_metrics', {
                              ...component.settings!.custom_metrics,
                              port: parseInt(e.target.value) || 8080,
                            })
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
                        updateSettings('envs', [
                          ...component.settings!.envs,
                          { key: '', value: '' },
                        ])
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
                            const updated = component.settings!.envs.map((env, i) =>
                              i === envIndex ? { ...env, key: e.target.value } : env
                            )
                            updateSettings('envs', updated)
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
                            const updated = component.settings!.envs.map((env, i) =>
                              i === envIndex ? { ...env, value: e.target.value } : env
                            )
                            updateSettings('envs', updated)
                          }}
                          placeholder="Value"
                          className="w-full px-2 py-1 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          updateSettings(
                            'envs',
                            component.settings!.envs.filter((_, i) => i !== envIndex)
                          )
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
                        updateSettings('secrets', [
                          ...component.settings!.secrets,
                          { name: '', key: '' },
                        ])
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
                            const updated = component.settings!.secrets.map((s, i) =>
                              i === secretIndex ? { ...s, name: e.target.value } : s
                            )
                            updateSettings('secrets', updated)
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
                            const updated = component.settings!.secrets.map((s, i) =>
                              i === secretIndex ? { ...s, key: e.target.value } : s
                            )
                            updateSettings('secrets', updated)
                          }}
                          placeholder="Key"
                          className="w-full px-2 py-1 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          updateSettings(
                            'secrets',
                            component.settings!.secrets.filter((_, i) => i !== secretIndex)
                          )
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
  )
}

