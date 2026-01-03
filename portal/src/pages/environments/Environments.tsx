import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Trash2, Plus, Globe } from 'lucide-react'
import { environmentsApi } from '../../services/api'
import type { Environment, EnvironmentCreate } from '../../types'
import DataTable from '../../components/DataTable'

function Environments() {
  const [isOpen, setIsOpen] = useState(false)
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const queryClient = useQueryClient()

  const { data: environments = [], isLoading } = useQuery({
    queryKey: ['environments'],
    queryFn: environmentsApi.list,
  })

  const [formData, setFormData] = useState<EnvironmentCreate>({
    name: '',
  })

  const createMutation = useMutation({
    mutationFn: environmentsApi.create,
    onSuccess: () => {
      setNotification({ type: 'success', message: 'Environment criado com sucesso' })
      queryClient.invalidateQueries({ queryKey: ['environments'] })
      setIsOpen(false)
      setFormData({ name: '' })
      setTimeout(() => setNotification(null), 5000)
    },
    onError: (error: any) => {
      setNotification({
        type: 'error',
        message: error.response?.data?.detail || 'Erro ao criar environment',
      })
      setTimeout(() => setNotification(null), 5000)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: environmentsApi.delete,
    onSuccess: () => {
      setNotification({ type: 'success', message: 'Environment deletado com sucesso' })
      queryClient.invalidateQueries({ queryKey: ['environments'] })
      setTimeout(() => setNotification(null), 5000)
    },
    onError: (error: any) => {
      setNotification({
        type: 'error',
        message: error.response?.data?.detail || 'Erro ao deletar environment',
      })
      setTimeout(() => setNotification(null), 5000)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name) {
      setNotification({ type: 'error', message: 'Nome é obrigatório' })
      setTimeout(() => setNotification(null), 5000)
      return
    }
    createMutation.mutate(formData)
  }

  const handleDelete = (uuid: string) => {
    if (confirm('Tem certeza que deseja deletar este environment?')) {
      deleteMutation.mutate(uuid)
    }
  }

  return (
    <div className="space-y-6">
      {notification && (
        <div
          className={`p-4 rounded-lg shadow-soft border ${
            notification.type === 'success'
              ? 'bg-green-50/80 text-green-700 border-green-200/60'
              : 'bg-red-50/80 text-red-700 border-red-200/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{notification.message}</span>
            <button onClick={() => setNotification(null)} className="hover:opacity-60 transition-opacity">
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Globe className="text-blue-600" size={22} />
            </div>
            <h1 className="text-3xl font-semibold text-slate-800">Environments</h1>
          </div>
          <p className="text-slate-500 ml-12">Gerenciar environments</p>
        </div>
        <button
          onClick={() => {
            setFormData({ name: '' })
            setIsOpen(true)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-soft hover:shadow-soft-lg transition-all duration-200 text-sm font-medium"
        >
          <Plus size={18} />
          Novo Environment
        </button>
      </div>

      {/* Table */}
      <DataTable<Environment>
        columns={[
          {
            key: 'name',
            label: 'Nome',
            render: (env) => <div className="text-sm font-medium text-slate-800">{env.name}</div>,
          },
          {
            key: 'created_at',
            label: 'Criado em',
            render: (env) => (
              <div className="text-sm text-slate-600">
                {new Date(env.created_at).toLocaleDateString('pt-BR')}
                    </div>
            ),
          },
        ]}
        data={environments}
        isLoading={isLoading}
        emptyMessage="Nenhum environment encontrado"
        loadingColor="blue"
        getRowKey={(env) => env.uuid}
        actions={(env) => [
          {
            label: 'Deletar',
            icon: <Trash2 size={14} />,
            onClick: () => handleDelete(env.uuid),
            variant: 'danger',
          },
        ]}
      />

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-soft-lg max-w-md w-full border border-slate-200/60 animate-zoom-in">
            <div className="flex items-center justify-between p-5 border-b border-slate-200/60 bg-slate-50/50">
              <h2 className="text-lg font-semibold text-slate-800">Novo Environment</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-white rounded-md transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Nome</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 transition-all text-sm"
                  placeholder="production"
                  required
                />
              </div>
              <div className="flex justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-soft text-sm font-medium disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Criando...' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Environments
