import { ReactNode, useState, useMemo } from 'react'
import { Search, X } from 'lucide-react'
import ActionMenu, { ActionMenuItem } from './ActionMenu'

export interface Column<T> {
  key: keyof T | string
  label: string
  render?: (item: T) => ReactNode
  searchable?: boolean
  width?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  isLoading?: boolean
  emptyMessage?: string
  loadingColor?: string
  getRowKey: (item: T) => string | number
  actions?: (item: T) => ActionMenuItem[]
  searchable?: boolean
  searchPlaceholder?: string
}

function DataTable<T>({
  columns,
  data,
  isLoading = false,
  emptyMessage = 'Nenhum item encontrado',
  loadingColor = 'blue',
  getRowKey,
  actions,
  searchable = true,
  searchPlaceholder = 'Buscar...',
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('')

  const colorClasses: Record<string, { spinner: string }> = {
    blue: { spinner: 'border-blue-200 border-t-blue-600' },
    indigo: { spinner: 'border-indigo-200 border-t-indigo-600' },
    sky: { spinner: 'border-sky-200 border-t-sky-600' },
    violet: { spinner: 'border-violet-200 border-t-violet-600' },
    purple: { spinner: 'border-purple-200 border-t-purple-600' },
  }

  const spinnerClass = colorClasses[loadingColor]?.spinner || colorClasses.blue.spinner
  const colSpan = columns.length + (actions ? 1 : 0)

  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data

    const searchLower = searchTerm.toLowerCase().trim()
    const searchableColumns = columns.filter((col) => col.searchable !== false)

    return data.filter((item) => {
      return searchableColumns.some((column) => {
        const value = item[column.key as keyof T]
        if (value === null || value === undefined) return false

        if (column.render) {
          const stringValue = String(value).toLowerCase()
          return stringValue.includes(searchLower)
        }

        const stringValue = String(value).toLowerCase()
        return stringValue.includes(searchLower)
      })
    })
  }, [data, searchTerm, columns])

  return (
    <div className="glass-effect rounded-xl shadow-soft overflow-hidden">
      {searchable && (
        <div className="px-6 py-4 border-b border-slate-200/60 bg-slate-50/50">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-10 py-2 border border-slate-300 rounded-lg bg-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 transition-all"
              placeholder={searchPlaceholder}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50/80">
            <tr>
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider"
                  style={column.width ? { width: column.width } : undefined}
                >
                  {column.label}
                </th>
              ))}
              {actions && (
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Ações
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100/60">
            {isLoading ? (
              <tr>
                <td colSpan={colSpan} className="px-6 py-12 text-center text-slate-400">
                  <div className="flex items-center justify-center gap-2">
                    <div className={`animate-spin rounded-full h-5 w-5 border-2 ${spinnerClass}`}></div>
                    <span className="text-sm">Carregando...</span>
                  </div>
                </td>
              </tr>
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="px-6 py-12 text-center text-slate-400 text-sm">
                  {searchTerm ? 'Nenhum resultado encontrado para a busca' : emptyMessage}
                </td>
              </tr>
            ) : (
              filteredData.map((item) => (
                <tr key={getRowKey(item)} className="hover:bg-slate-50/50 transition-colors">
                  {columns.map((column) => (
                    <td
                      key={String(column.key)}
                      className="px-6 py-3.5 whitespace-nowrap"
                      style={column.width ? { width: column.width } : undefined}
                    >
                      {column.render ? (
                        column.render(item)
                      ) : (
                        <div className="text-sm text-slate-600">
                          {String(item[column.key as keyof T] ?? '')}
                        </div>
                      )}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      <div className="flex justify-end">
                        <ActionMenu items={actions(item)} />
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default DataTable

