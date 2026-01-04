interface ScheduleInputProps {
  schedule: string
  onChange: (schedule: string) => void
}

export function ScheduleInput({ schedule, onChange }: ScheduleInputProps) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">
        Schedule (Cron Expression) *
      </label>
      <input
        type="text"
        value={schedule}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 font-mono"
        placeholder="0 0 * * *"
        required
      />
      <p className="text-xs text-slate-400 mt-1">
        Cron expression format: minute hour day month weekday (e.g., "0 0 * * *" for daily at midnight)
      </p>
    </div>
  )
}

