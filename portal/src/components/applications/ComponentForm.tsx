import { X } from 'lucide-react'
import type { ComponentFormData, WebappSettings, CronSettings } from './types'
import { getDefaultWebappSettings, getDefaultCronSettings } from './types'
import { WebappForm } from './WebappForm'
import { CronForm } from './CronForm'
import { WorkerForm } from './WorkerForm'

interface ComponentFormProps {
  component: ComponentFormData
  onChange: (component: ComponentFormData) => void
  onRemove?: () => void
  showRemoveButton?: boolean
  title?: string
  isEditing?: boolean
}

export function ComponentForm({
  component,
  onChange,
  onRemove,
  showRemoveButton = true,
  title,
  isEditing = false,
}: ComponentFormProps) {
  const updateField = (field: keyof ComponentFormData, value: any) => {
    onChange({ ...component, [field]: value })
  }

  const handleSettingsChange = (settings: WebappSettings | CronSettings) => {
    updateField('settings', settings)
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
        {!isEditing && (
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
        )}
        {isEditing && (
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Name</label>
            <div className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm bg-slate-50 text-slate-600">
              {component.name}
            </div>
            <p className="text-xs text-slate-500 mt-1">Component name cannot be changed after creation</p>
          </div>
        )}

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
            {component.settings && 'endpoints' in component.settings && (
              <WebappForm
                settings={component.settings as WebappSettings}
                onChange={handleSettingsChange as (settings: WebappSettings) => void}
              />
            )}
          </>
        )}

        {component.type === 'cron' && (
          <>
            <div className="flex items-center gap-4">
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
            {component.settings && 'schedule' in component.settings && (
              <CronForm
                settings={component.settings as CronSettings}
                onChange={handleSettingsChange as (settings: CronSettings) => void}
              />
            )}
          </>
        )}

        {component.type === 'worker' && (
          <>
            <div className="flex items-center gap-4">
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
            {component.settings && !('endpoints' in component.settings) && (
              <WorkerForm
                settings={{
                  envs: (component.settings as CronSettings).envs,
                  command: (component.settings as CronSettings).command,
                  cpu: (component.settings as CronSettings).cpu,
                  memory: (component.settings as CronSettings).memory,
                }}
                onChange={(workerSettings) => {
                  // Convert worker settings to cron settings format (without schedule)
                  const cronSettings: CronSettings = {
                    ...workerSettings,
                    schedule: '0 0 * * *', // Default schedule, not used for worker
                  }
                  handleSettingsChange(cronSettings)
                }}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}
