'use client'

import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Plus, Pencil, Calendar, Search, ChevronDown } from 'lucide-react'
import { api } from '@/lib/api'
import { useToast } from '@/components/ui/Toaster'

type Appointment = {
  id: string
  userId: string
  data: string
  horario: string
  status: string
  tipo?: string
  observacoes?: string
}

type UserOption = { id: string; nome: string; email: string; role: string }

export default function AdminAgenda() {
  const { toast } = useToast()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [users, setUsers] = useState<UserOption[]>([])
  const [loading, setLoading] = useState(true)
  const [filterDate, setFilterDate] = useState('')
  const [modal, setModal] = useState<'add' | 'edit' | null>(null)
  const [editing, setEditing] = useState<Appointment | null>(null)
  const [form, setForm] = useState({ userId: '', data: '', horario: '', tipo: 'Consulta', observacoes: '', status: 'pendente' })
  const [patientSearch, setPatientSearch] = useState('')
  const [patientDropdownOpen, setPatientDropdownOpen] = useState(false)
  const patientInputRef = useRef<HTMLInputElement>(null)
  const patientListRef = useRef<HTMLDivElement>(null)

  const loadAppointments = () => {
    const query = filterDate ? `?date=${filterDate}` : ''
    setLoading(true)
    api
      .get<Appointment[]>(`/appointments/all${query}`)
      .then((r) => setAppointments(Array.isArray(r.data) ? r.data : []))
      .catch(() => setAppointments([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    setLoading(true)
    loadAppointments()
  }, [filterDate])

  useEffect(() => {
    api.get<UserOption[]>('/users').then((r) => setUsers(Array.isArray(r.data) ? r.data.filter((u) => u.role === 'paciente') : [])).catch(() => setUsers([]))
  }, [])

  const userLabel = (u: UserOption) => `${u.nome} (${u.email})`

  const openAdd = () => {
    const defaultId = users[0]?.id ?? ''
    const defaultUser = users.find((u) => u.id === defaultId)
    setForm({
      userId: defaultId,
      data: new Date().toISOString().slice(0, 10),
      horario: '09:00',
      tipo: 'Consulta',
      observacoes: '',
      status: 'pendente',
    })
    setPatientSearch(defaultUser ? userLabel(defaultUser) : '')
    setPatientDropdownOpen(false)
    setEditing(null)
    setModal('add')
  }
  const openEdit = (a: Appointment) => {
    setEditing(a)
    setForm({
      userId: a.userId,
      data: a.data,
      horario: a.horario,
      tipo: a.tipo ?? 'Consulta',
      observacoes: a.observacoes ?? '',
      status: a.status,
    })
    setModal('edit')
  }
  const closeModal = () => {
    setModal(null)
    setEditing(null)
  }

  const submitAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.userId) {
      toast('Selecione um paciente na lista.', 'error')
      return
    }
    try {
      await api.post('/appointments/for-user', {
        userId: form.userId,
        data: form.data,
        horario: form.horario,
        tipo: form.tipo,
        observacoes: form.observacoes || undefined,
      })
      toast('Consulta agendada.', 'success')
      closeModal()
      loadAppointments()
    } catch (err: unknown) {
      toast((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Erro ao agendar.', 'error')
    }
  }
  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editing) return
    try {
      await api.patch(`/appointments/${editing.id}`, {
        status: form.status,
        data: form.data,
        horario: form.horario,
        tipo: form.tipo,
        observacoes: form.observacoes || undefined,
      })
      toast('Consulta atualizada.', 'success')
      closeModal()
      loadAppointments()
    } catch {
      toast('Erro ao atualizar.', 'error')
    }
  }

  const userName = (userId: string) => users.find((u) => u.id === userId)?.nome ?? userId

  const patientFiltered = patientSearch.trim()
    ? users.filter(
        (u) =>
          u.nome.toLowerCase().includes(patientSearch.toLowerCase()) ||
          u.email.toLowerCase().includes(patientSearch.toLowerCase())
      )
    : users

  useEffect(() => {
    if (modal !== 'add' || !patientDropdownOpen) return
    const close = (e: MouseEvent) => {
      if (
        patientInputRef.current?.contains(e.target as Node) ||
        patientListRef.current?.contains(e.target as Node)
      )
        return
      setPatientDropdownOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [modal, patientDropdownOpen])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-night-text">Agenda</h1>
          <p className="text-gray-500 dark:text-night-muted text-sm mt-0.5">Consultas de todos os pacientes.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="input-field w-auto max-w-[180px]"
          />
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-olive text-white font-medium shadow-button hover:opacity-95"
          >
            <Plus className="h-5 w-5" />
            Nova consulta
          </button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-gray-mist/50 dark:border-night-border bg-white dark:bg-night-card p-12 text-center text-gray-500 dark:text-night-muted">
          Carregando...
        </div>
      ) : appointments.length === 0 ? (
        <div className="rounded-2xl border border-gray-mist/50 dark:border-night-border bg-white dark:bg-night-card p-12 text-center">
          <Calendar className="h-12 w-12 text-gray-400 dark:text-night-muted mx-auto mb-4" />
          <p className="text-gray-600 dark:text-night-muted">
            {filterDate ? 'Nenhuma consulta nesta data.' : 'Nenhuma consulta agendada.'}
          </p>
          <button type="button" onClick={openAdd} className="mt-4 text-olive dark:text-olive-light font-medium">
            Agendar consulta
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-mist/50 dark:border-night-border bg-white dark:bg-night-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-mist/50 dark:border-night-border bg-gray-mist/30 dark:bg-night-surface">
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-night-muted uppercase">Paciente</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-night-muted uppercase">Data</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-night-muted uppercase">Horário</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-night-muted uppercase">Tipo</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-night-muted uppercase">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-night-muted uppercase w-24">Ações</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((a) => (
                  <tr key={a.id} className="border-b border-gray-mist/30 dark:border-night-border/50 hover:bg-gray-mist/20 dark:hover:bg-night-surface/50">
                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-night-text">{userName(a.userId)}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-night-muted">
                      {new Date(a.data + 'T12:00:00').toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-night-muted">{a.horario}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-night-muted">{a.tipo ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-lg text-xs font-medium ${
                          a.status === 'confirmado'
                            ? 'bg-green-500/20 text-green-700 dark:text-green-400'
                            : a.status === 'cancelado'
                              ? 'bg-red-500/20 text-red-700 dark:text-red-400'
                              : 'bg-amber-500/20 text-amber-700 dark:text-amber-400'
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => openEdit(a)}
                        className="p-2 rounded-lg text-gray-600 dark:text-night-muted hover:bg-olive/15 hover:text-olive dark:hover:text-olive-light"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modal === 'add' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={closeModal}>
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl bg-white dark:bg-night-card border border-gray-mist/50 dark:border-night-border shadow-xl p-6"
          >
            <h2 className="text-lg font-bold text-gray-800 dark:text-night-text mb-4">Nova consulta</h2>
            {users.length === 0 && (
              <div className="mb-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-sm text-amber-800 dark:text-amber-200">
                Nenhum paciente cadastrado. Cadastre pacientes em <strong>Usuários</strong> antes de agendar.
              </div>
            )}
            <form onSubmit={submitAdd} className="space-y-4">
              <div className="relative" ref={patientInputRef}>
                <label className="block text-sm font-medium text-gray-700 dark:text-night-muted mb-1">Paciente</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-night-muted pointer-events-none" />
                  <input
                    type="text"
                    value={patientSearch}
                    onChange={(e) => {
                      setPatientSearch(e.target.value)
                      setPatientDropdownOpen(true)
                      const chosen = users.find(
                        (u) =>
                          u.nome.toLowerCase() === e.target.value.toLowerCase() ||
                          userLabel(u) === e.target.value
                      )
                      if (chosen) setForm((f) => ({ ...f, userId: chosen.id }))
                      else if (!e.target.value) setForm((f) => ({ ...f, userId: '' }))
                    }}
                    onFocus={() => setPatientDropdownOpen(true)}
                    placeholder="Digite nome ou e-mail para buscar..."
                    className="input-field pl-10 pr-10"
                    autoComplete="off"
                  />
                  <ChevronDown
                    className={`absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-night-muted transition-transform ${patientDropdownOpen ? 'rotate-180' : ''}`}
                  />
                </div>
                {patientDropdownOpen && (
                  <div
                    ref={patientListRef}
                    className="absolute z-10 w-full mt-1 max-h-56 overflow-auto rounded-xl border border-gray-mist/50 dark:border-night-border bg-white dark:bg-night-card shadow-lg py-1"
                  >
                    {patientFiltered.length === 0 ? (
                      <p className="px-4 py-3 text-sm text-gray-500 dark:text-night-muted">Nenhum paciente encontrado.</p>
                    ) : (
                      patientFiltered.map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => {
                            setForm((f) => ({ ...f, userId: u.id }))
                            setPatientSearch(userLabel(u))
                            setPatientDropdownOpen(false)
                            patientInputRef.current?.focus()
                          }}
                          className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-mist/50 dark:hover:bg-night-surface ${form.userId === u.id ? 'bg-olive/10 text-olive dark:text-olive-light font-medium' : 'text-gray-800 dark:text-night-text'}`}
                        >
                          {u.nome} <span className="text-gray-500 dark:text-night-muted">({u.email})</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-night-muted mb-1">Data</label>
                  <input
                    type="date"
                    required
                    value={form.data}
                    onChange={(e) => setForm((f) => ({ ...f, data: e.target.value }))}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-night-muted mb-1">Horário</label>
                  <input
                    type="time"
                    required
                    value={form.horario}
                    onChange={(e) => setForm((f) => ({ ...f, horario: e.target.value }))}
                    className="input-field"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-night-muted mb-1">Tipo</label>
                <input
                  type="text"
                  value={form.tipo}
                  onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-night-muted mb-1">Observações</label>
                <textarea
                  value={form.observacoes}
                  onChange={(e) => setForm((f) => ({ ...f, observacoes: e.target.value }))}
                  className="input-field min-h-[80px]"
                  rows={2}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" className="btn-primary flex-1">Agendar</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {modal === 'edit' && editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={closeModal}>
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl bg-white dark:bg-night-card border border-gray-mist/50 dark:border-night-border shadow-xl p-6"
          >
            <h2 className="text-lg font-bold text-gray-800 dark:text-night-text mb-4">Editar consulta</h2>
            <form onSubmit={submitEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-night-muted mb-1">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                  className="input-field"
                >
                  <option value="pendente">Pendente</option>
                  <option value="confirmado">Confirmado</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-night-muted mb-1">Data</label>
                  <input
                    type="date"
                    required
                    value={form.data}
                    onChange={(e) => setForm((f) => ({ ...f, data: e.target.value }))}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-night-muted mb-1">Horário</label>
                  <input
                    type="time"
                    required
                    value={form.horario}
                    onChange={(e) => setForm((f) => ({ ...f, horario: e.target.value }))}
                    className="input-field"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-night-muted mb-1">Tipo</label>
                <input
                  type="text"
                  value={form.tipo}
                  onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-night-muted mb-1">Observações</label>
                <textarea
                  value={form.observacoes}
                  onChange={(e) => setForm((f) => ({ ...f, observacoes: e.target.value }))}
                  className="input-field min-h-[80px]"
                  rows={2}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" className="btn-primary flex-1">Salvar</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}
