interface ComponentsByClusterProps {
  componentsByCluster: Record<string, number>
}

export function ComponentsByCluster({ componentsByCluster }: ComponentsByClusterProps) {
  if (Object.keys(componentsByCluster).length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-soft border border-slate-200/60">
      <h2 className="text-lg font-semibold text-slate-800 mb-4">Components by Cluster</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(componentsByCluster).map(([clusterName, count]) => (
          <div key={clusterName} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-sm font-medium text-slate-700">{clusterName}</span>
            <span className="text-lg font-semibold text-slate-800">{count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

