import { X } from 'lucide-react'

interface Endpoint {
  source_protocol: 'http' | 'https' | 'tcp' | 'tls'
  source_port: number
  dest_protocol: 'http' | 'https' | 'tcp' | 'tls'
  dest_port: number
}

interface EndpointsInputProps {
  endpoints: Endpoint[]
  onChange: (endpoints: Endpoint[]) => void
}

export function EndpointsInput({ endpoints, onChange }: EndpointsInputProps) {
  const addEndpoint = () => {
    onChange([
      ...endpoints,
      { source_protocol: 'http', source_port: 80, dest_protocol: 'http', dest_port: 8080 },
    ])
  }

  const updateEndpoint = (index: number, field: keyof Endpoint, value: any) => {
    const updated = endpoints.map((ep, i) =>
      i === index ? { ...ep, [field]: value } : ep
    )
    onChange(updated)
  }

  const removeEndpoint = (index: number) => {
    onChange(endpoints.filter((_, i) => i !== index))
  }

  return (
    <div className="border border-slate-200 rounded-lg p-3 bg-white">
      <div className="flex items-center justify-between mb-2">
        <h5 className="text-xs font-semibold text-slate-700">Endpoints</h5>
        <button
          type="button"
          onClick={addEndpoint}
          className="text-xs text-blue-600 hover:text-blue-700"
        >
          + Add
        </button>
      </div>
      {endpoints.map((endpoint, epIndex) => (
        <div key={epIndex} className="mb-2 p-2 bg-slate-50 rounded border border-slate-200">
          <div className="grid grid-cols-4 gap-2">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Source Protocol</label>
              <select
                value={endpoint.source_protocol}
                onChange={(e) => updateEndpoint(epIndex, 'source_protocol', e.target.value)}
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
                onChange={(e) => updateEndpoint(epIndex, 'source_port', parseInt(e.target.value) || 80)}
                className="w-full px-2 py-1 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Dest Protocol</label>
              <select
                value={endpoint.dest_protocol}
                onChange={(e) => updateEndpoint(epIndex, 'dest_protocol', e.target.value)}
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
                  onChange={(e) => updateEndpoint(epIndex, 'dest_port', parseInt(e.target.value) || 8080)}
                  className="w-full px-2 py-1 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400"
                />
              </div>
              {endpoints.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeEndpoint(epIndex)}
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
  )
}

