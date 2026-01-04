import type { CronSettings } from './types'
import { CpuMemoryInput } from './form-components/CpuMemoryInput'
import { EnvVarsInput } from './form-components/EnvVarsInput'
import { CommandInput } from './form-components/CommandInput'

interface WorkerSettings {
  envs: Array<{ key: string; value: string }>
  command: string | null
  cpu: number
  memory: number
}

interface WorkerFormProps {
  settings: WorkerSettings
  onChange: (settings: WorkerSettings) => void
}

export function WorkerForm({ settings, onChange }: WorkerFormProps) {
  const updateField = <K extends keyof WorkerSettings>(field: K, value: WorkerSettings[K]) => {
    onChange({ ...settings, [field]: value })
  }

  return (
    <div className="mt-4 pt-4 border-t border-slate-200 space-y-4">
      <h4 className="text-sm font-semibold text-slate-700">Settings</h4>

      <CpuMemoryInput
        cpu={settings.cpu}
        memory={settings.memory}
        onCpuChange={(cpu) => updateField('cpu', cpu)}
        onMemoryChange={(memory) => updateField('memory', memory)}
      />

      <CommandInput
        command={settings.command}
        onChange={(command) => updateField('command', command)}
      />

      <EnvVarsInput
        envs={settings.envs}
        onChange={(envs) => updateField('envs', envs)}
      />
    </div>
  )
}

