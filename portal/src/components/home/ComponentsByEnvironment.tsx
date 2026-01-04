interface ComponentsByEnvironmentProps {
  componentsByEnvironment: Record<string, number>
}

export function ComponentsByEnvironment({ componentsByEnvironment }: ComponentsByEnvironmentProps) {
  if (Object.keys(componentsByEnvironment).length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-soft border border-slate-200/60">
      <h2 className="text-lg font-semibold text-slate-800 mb-4">Components by Environment</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(componentsByEnvironment).map(([envName, count]) => (
          <div key={envName} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-sm font-medium text-slate-700">{envName}</span>
            <span className="text-lg font-semibold text-slate-800">{count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

