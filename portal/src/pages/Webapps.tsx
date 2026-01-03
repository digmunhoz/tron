import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Trash2, Plus, AppWindow } from 'lucide-react'
import { applicationsApi } from '../services/api'
import type { Application, ApplicationCreate } from '../types'
import DataTable from '../components/DataTable'

function Applications() {
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const queryClient = useQueryClient()

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['applications'],
    queryFn: applicationsApi.list,
  })

  const [formData, setFormData] = useState<ApplicationCreate>({
    name: '',
    repository: '',
  })

  const createMutation = useMutation({
    mutationFn: applicationsApi.create,
    onSuccess: () => {
      setNotification({ type: 'success', message: 'Application created successfully' })
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      setIsOpen(false)
      setFormData({ name: '', repository: '' })
      setTimeout(() => setNotification(null), 5000)
    },
    onError: (error: any) => {
      setNotification({
        type: 'error',
        message: error.response?.data?.detail || 'Error creating application',
      })
      setTimeout(() => setNotification(null), 5000)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: applicationsApi.delete,
    onSuccess: () => {
      setNotification({ type: 'success', message: 'Application deleted successfully' })
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      setTimeout(() => setNotification(null), 5000)
    },
    onError: (error: any) => {
      setNotification({
        type: 'error',
        message: error.response?.data?.detail || 'Error deleting application',
      })
      setTimeout(() => setNotification(null), 5000)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name) {
      setNotification({ type: 'error', message: 'Name is required' })
      setTimeout(() => setNotification(null), 5000)
      return
    }
    createMutation.mutate(formData)
  }

  const handleDelete = (uuid: string) => {
    if (confirm('Are you sure you want to delete this application?')) {
      deleteMutation.mutate(uuid)
    }
  }

  const getInitials = (name: string): string => {
    const words = name.trim().split(/\s+/)
    if (words.length === 0) return ''
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase()
    return (words[0][0] + words[words.length - 1][0]).toUpperCase()
  }

  const getColorFromName = (name: string): string => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-yellow-500',
      'bg-red-500',
      'bg-teal-500',
      'bg-orange-500',
      'bg-cyan-500',
    ]
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colors[Math.abs(hash) % colors.length]
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
              <AppWindow className="text-blue-600" size={22} />
            </div>
            <h1 className="text-3xl font-semibold text-slate-800">Applications</h1>
          </div>
          <p className="text-slate-500 ml-12">Manage applications</p>
        </div>
        <button
          onClick={() => {
            setFormData({ name: '', repository: '' })
            setIsOpen(true)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-soft hover:shadow-soft-lg transition-all duration-200 text-sm font-medium"
        >
          <Plus size={18} />
          New Application
        </button>
      </div>

      {/* Table */}
      <DataTable<Application>
        columns={[
          {
            key: 'avatar',
            label: '',
            width: '80px',
            render: (application) => (
              <div className={`w-10 h-10 rounded-full ${getColorFromName(application.name)} flex items-center justify-center text-white font-semibold text-sm`}>
                {getInitials(application.name)}
              </div>
            ),
          },
          {
            key: 'name',
            label: 'Name',
            render: (application) => (
              <div>
                <div className="text-sm font-medium text-slate-800">{application.name}</div>
                <small className="text-xs text-slate-500">{application.uuid}</small>
              </div>
            ),
          },
          {
            key: 'repository',
            label: 'Repository',
            render: (application) => (
              <div className="text-sm text-slate-600">{application.repository || '-'}</div>
            ),
          },
          {
            key: 'status',
            label: 'Status',
            render: (application) => (
              <div>
                {application.enabled ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Enabled
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    Disabled
                  </span>
                )}
              </div>
            ),
          },
          {
            key: 'created_at',
            label: 'Creation Date',
            render: (application) => (
              <div className="text-sm text-slate-600">
                {new Date(application.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            ),
          },
          {
            key: 'updated_at',
            label: 'Update Date',
            render: (application) => (
              <div className="text-sm text-slate-600">
                {new Date(application.updated_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            ),
          },
        ]}
        data={applications}
        isLoading={isLoading}
        emptyMessage="No applications found"
        loadingColor="blue"
        getRowKey={(application) => application.uuid}
        actions={(application) => [
          {
            label: 'View',
            icon: <AppWindow size={14} />,
            onClick: () => navigate(`/applications/${application.uuid}`),
            variant: 'default',
          },
          {
            label: 'Deletar',
            icon: <Trash2 size={14} />,
            onClick: () => handleDelete(application.uuid),
            variant: 'danger',
          },
        ]}
      />

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-soft-lg max-w-md w-full border border-slate-200/60 animate-zoom-in">
            <div className="flex items-center justify-between p-5 border-b border-slate-200/60 bg-slate-50/50">
              <h2 className="text-lg font-semibold text-slate-800">New Application</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-white rounded-md transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 transition-all text-sm"
                  placeholder="my-application"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Repository</label>
                <input
                  type="text"
                  value={formData.repository || ''}
                  onChange={(e) => setFormData({ ...formData, repository: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 transition-all text-sm"
                  placeholder="https://github.com/user/repo"
                />
              </div>
              <div className="flex justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-soft text-sm font-medium disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Applications
