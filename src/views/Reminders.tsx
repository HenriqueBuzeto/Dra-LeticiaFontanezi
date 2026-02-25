'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, List, Calendar, CalendarDays, Brush, Pill, Stethoscope, X, Check } from 'lucide-react'
import { useToast } from '@/components/ui/Toaster'

type ReminderIcon = 'calendar' | 'brush' | 'pill' | 'stethoscope'
type ReminderType = 'consulta' | 'escovacao' | 'medicamento' | 'outro'

interface ReminderItem {
  id: string
  titulo: string
  data: string
  horario?: string
  tipo: ReminderType
  feito: boolean
  emBreve?: boolean
}

const ICON_MAP: Record<ReminderIcon, typeof CalendarDays> = {
  calendar: CalendarDays,
  brush: Brush,
  pill: Pill,
  stethoscope: Stethoscope,
}

const TIPO_ICON: Record<ReminderType, ReminderIcon> = {
  consulta: 'calendar',
  escovacao: 'brush',
  medicamento: 'pill',
  outro: 'stethoscope',
}

const TIPO_LABEL: Record<ReminderType, string> = {
  consulta: 'Consulta',
  escovacao: 'Higiene',
  medicamento: 'Medicamento',
  outro: 'Outro',
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

function getDaysInMonth(year: number, month: number) {
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  const startPad = first.getDay()
  const days = last.getDate()
  return { startPad, days, year, month }
}

export default function Reminders() {
  const [view, setView] = useState<'list' | 'calendar'>('list')
  const [filter, setFilter] = useState<'todos' | 'hoje' | 'semana'>('todos')
  const [showAddModal, setShowAddModal] = useState(false)
  const [calendarDate, setCalendarDate] = useState(() => ({ year: new Date().getFullYear(), month: new Date().getMonth() }))
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const { toast } = useToast()

  const [reminders, setReminders] = useState<ReminderItem[]>([
    { id: '1', titulo: 'Próxima consulta', data: '2025-02-15', horario: '10:00', tipo: 'consulta', feito: false, emBreve: true },
    { id: '2', titulo: 'Escovar os dentes', data: new Date().toISOString().slice(0, 10), horario: '08:00', tipo: 'escovacao', feito: true },
    { id: '3', titulo: 'Renovar receita', data: '2025-02-18', tipo: 'medicamento', feito: false },
  ])

  const { startPad, days, year, month } = useMemo(
    () => getDaysInMonth(calendarDate.year, calendarDate.month),
    [calendarDate]
  )

  const hoje = new Date()
  const hojeStr = hoje.toISOString().slice(0, 10)

  const filteredByView = useMemo(() => {
    let list: ReminderItem[] = []
    if (view === 'calendar' && selectedDay !== null) {
      const d = String(selectedDay).padStart(2, '0')
      const dataStr = `${calendarDate.year}-${String(calendarDate.month + 1).padStart(2, '0')}-${d}`
      list = reminders.filter((r) => r.data === dataStr)
    } else if (view === 'list') {
      if (filter === 'hoje') list = reminders.filter((r) => r.data === hojeStr)
      else if (filter === 'semana') {
        const weekEnd = new Date(hoje)
        weekEnd.setDate(weekEnd.getDate() + 7)
        list = reminders.filter((r) => {
          const d = new Date(r.data + 'T12:00:00')
          const h = new Date(hoje)
          h.setHours(0, 0, 0, 0)
          return d >= h && d <= weekEnd
        })
      } else list = [...reminders]
      list.sort((a, b) => (a.data === b.data ? (a.horario || '').localeCompare(b.horario || '') : a.data.localeCompare(b.data)))
    }
    return list
  }, [view, filter, reminders, selectedDay, calendarDate, hojeStr, hoje])

  const daysWithEvents = useMemo(() => {
    const set = new Set<string>()
    reminders.forEach((r) => set.add(r.data))
    return set
  }, [reminders])

  const markDone = (id: string) => {
    setReminders((prev) => prev.map((r) => (r.id === id ? { ...r, feito: !r.feito } : r)))
    toast('Lembrete atualizado', 'success')
  }

  const addReminder = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const titulo = (form.elements.namedItem('titulo') as HTMLInputElement).value
    const data = (form.elements.namedItem('data') as HTMLInputElement).value
    const horario = (form.elements.namedItem('horario') as HTMLInputElement).value
    const tipo = (form.elements.namedItem('tipo') as HTMLSelectElement).value as ReminderType
    if (!titulo.trim() || !data) return
    setReminders((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        titulo: titulo.trim(),
        data,
        horario: horario || undefined,
        tipo,
        feito: false,
      },
    ])
    setShowAddModal(false)
    toast('Lembrete adicionado', 'success')
  }

  const calendarGrid = useMemo(() => {
    const cells: { day: number | null; dateStr: string | null }[] = []
    for (let i = 0; i < startPad; i++) cells.push({ day: null, dateStr: null })
    for (let d = 1; d <= days; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      cells.push({ day: d, dateStr })
    }
    return cells
  }, [startPad, days, year, month])

  const prevMonth = () => {
    setCalendarDate((prev) =>
      prev.month === 0 ? { year: prev.year - 1, month: 11 } : { year: prev.year, month: prev.month - 1 }
    )
    setSelectedDay(null)
  }
  const nextMonth = () => {
    setCalendarDate((prev) =>
      prev.month === 11 ? { year: prev.year + 1, month: 0 } : { year: prev.year, month: prev.month + 1 }
    )
    setSelectedDay(null)
  }

  return (
    <div className="px-4 lg:px-0 py-6 pb-40 lg:pb-36">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-xl lg:text-2xl font-bold text-gray-800">Lembretes</h1>
      </header>

      {/* Toggle Lista | Calendário */}
      <div className="flex gap-2 p-1.5 rounded-2xl bg-gray-mist/50 mb-6">
        <button
          type="button"
          onClick={() => setView('list')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all ${
            view === 'list' ? 'bg-white shadow-soft text-olive' : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <List className="h-4 w-4" />
          Lista
        </button>
        <button
          type="button"
          onClick={() => setView('calendar')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all ${
            view === 'calendar' ? 'bg-white shadow-soft text-olive' : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <Calendar className="h-4 w-4" />
          Calendário
        </button>
      </div>

      <AnimatePresence mode="wait">
        {view === 'list' ? (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-6"
          >
            {/* Filtros lista */}
            <div className="flex gap-2">
              {(['todos', 'hoje', 'semana'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium ${
                    filter === f ? 'bg-olive text-white' : 'bg-white text-gray-600 border border-gray-mist/50'
                  }`}
                >
                  {f === 'todos' ? 'Todos' : f === 'hoje' ? 'Hoje' : 'Esta semana'}
                </button>
              ))}
            </div>

            <section>
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                {filter === 'hoje' ? 'Lembretes de hoje' : filter === 'semana' ? 'Esta semana' : 'Próximos lembretes'}
              </h2>
              {filteredByView.length === 0 ? (
                <div className="rounded-2xl bg-gray-mist/30 border border-gray-mist/50 p-8 text-center">
                  <CalendarDays className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 text-sm">Nenhum lembrete neste período.</p>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(true)}
                    className="text-olive font-medium text-sm mt-2"
                  >
                    Adicionar lembrete
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredByView.map((r, i) => {
                    const Icon = ICON_MAP[TIPO_ICON[r.tipo]]
                    return (
                      <motion.div
                        key={r.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className={`rounded-2xl bg-white shadow-soft border border-gray-mist/50 p-4 flex items-center gap-4 ${
                          r.feito ? 'opacity-75' : ''
                        }`}
                      >
                        <div className="w-12 h-12 rounded-xl bg-olive/10 flex items-center justify-center shrink-0">
                          <Icon className="h-6 w-6 text-olive" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium ${r.feito ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
                            {r.titulo}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {new Date(r.data).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })}
                            {r.horario ? ` · ${r.horario}` : ''} · {TIPO_LABEL[r.tipo]}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {r.emBreve && !r.feito && (
                            <span className="text-xs font-semibold text-olive bg-olive/15 px-2 py-1 rounded-lg">
                              Em breve
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => markDone(r.id)}
                            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                              r.feito ? 'bg-green-500/20 text-green-600' : 'bg-gray-mist/50 text-gray-400 hover:bg-olive/10 hover:text-olive'
                            }`}
                            title={r.feito ? 'Desmarcar' : 'Marcar como feito'}
                          >
                            <Check className="h-5 w-5" />
                          </button>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </section>
          </motion.div>
        ) : (
          <motion.div
            key="calendar"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-6"
          >
            {/* Navegação mês */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={prevMonth}
                className="p-2 rounded-xl hover:bg-gray-mist/50 text-gray-600"
                aria-label="Mês anterior"
              >
                <span className="text-lg font-semibold">‹</span>
              </button>
              <h2 className="text-base font-bold text-gray-800">
                {MESES[month]} {year}
              </h2>
              <button
                type="button"
                onClick={nextMonth}
                className="p-2 rounded-xl hover:bg-gray-mist/50 text-gray-600"
                aria-label="Próximo mês"
              >
                <span className="text-lg font-semibold">›</span>
              </button>
            </div>

            {/* Grid do calendário */}
            <div className="rounded-2xl bg-white shadow-soft border border-gray-mist/50 overflow-hidden">
              <div className="grid grid-cols-7 text-center text-xs font-medium text-gray-500 border-b border-gray-mist/50">
                {WEEKDAYS.map((w) => (
                  <div key={w} className="py-2">
                    {w}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {calendarGrid.map((cell, idx) => (
                  <button
                    key={idx}
                    type="button"
                    disabled={!cell.day}
                    onClick={() => cell.day && setSelectedDay(cell.day)}
                    className={`min-h-[44px] sm:min-h-[52px] flex flex-col items-center justify-center text-sm transition-colors ${
                      !cell.day
                        ? 'text-transparent cursor-default'
                        : selectedDay === cell.day
                          ? 'bg-olive text-white font-bold rounded-lg'
                          : cell.dateStr && daysWithEvents.has(cell.dateStr)
                            ? 'bg-olive/10 text-olive font-medium hover:bg-olive/20'
                            : 'text-gray-700 hover:bg-gray-mist/50'
                    }`}
                  >
                    {cell.day}
                    {cell.dateStr && daysWithEvents.has(cell.dateStr) && (
                      <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${selectedDay === cell.day ? 'bg-white' : 'bg-olive'}`} />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Lembretes do dia selecionado */}
            {selectedDay !== null && (
              <section>
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  {selectedDay} de {MESES[month]}
                </h2>
                {filteredByView.length === 0 ? (
                  <p className="text-sm text-gray-500 py-4">Nenhum lembrete neste dia.</p>
                ) : (
                  <div className="space-y-2">
                    {filteredByView.map((r) => {
                      const Icon = ICON_MAP[TIPO_ICON[r.tipo]]
                      return (
                        <div
                          key={r.id}
                          className="rounded-2xl bg-white shadow-soft border border-gray-mist/50 p-4 flex items-center gap-4"
                        >
                          <div className="w-10 h-10 rounded-xl bg-olive/10 flex items-center justify-center shrink-0">
                            <Icon className="h-5 w-5 text-olive" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-800">{r.titulo}</p>
                            <p className="text-xs text-gray-500">{r.horario ?? '—'} · {TIPO_LABEL[r.tipo]}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => markDone(r.id)}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center ${r.feito ? 'bg-green-500/20 text-green-600' : 'bg-gray-mist/50'}`}
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </section>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB */}
      <motion.button
        type="button"
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-24 right-4 lg:right-8 w-14 h-14 rounded-full bg-olive text-white shadow-button flex items-center justify-center z-20"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Novo lembrete"
      >
        <Plus className="h-6 w-6" />
      </motion.button>

      {/* Modal Novo Lembrete */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => setShowAddModal(false)}
          >
            <div className="absolute inset-0 bg-black/50" />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-white flex items-center justify-between p-4 border-b border-gray-mist/50 rounded-t-3xl">
                <h3 className="text-lg font-bold text-gray-800">Novo lembrete</h3>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="p-2 rounded-xl hover:bg-gray-mist/50"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={addReminder} className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                  <input
                    name="titulo"
                    type="text"
                    required
                    placeholder="Ex: Escovar os dentes"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                  <select name="tipo" className="input-field" defaultValue="outro">
                    {Object.entries(TIPO_LABEL).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                    <input
                      name="data"
                      type="date"
                      required
                      defaultValue={hojeStr}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Horário (opcional)</label>
                    <input name="horario" type="time" className="input-field" />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary flex-1">
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary flex-1">
                    Adicionar
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
