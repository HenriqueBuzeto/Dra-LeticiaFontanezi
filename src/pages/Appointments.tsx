'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Calendar, ChevronRight, ChevronLeft, CalendarDays } from 'lucide-react'
import { api } from '@/lib/api'
import type { Appointment } from '@/types'
import { CardSkeleton } from '@/components/ui/Skeleton'

const STATUS_LABEL: Record<string, string> = {
  confirmado: 'Confirmado',
  pendente: 'Pendente',
  cancelado: 'Cancelado',
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

function isAppointmentFuture(apt: Appointment): boolean {
  const today = new Date().toISOString().slice(0, 10)
  return apt.data >= today && apt.status !== 'cancelado'
}

export default function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [calendarView, setCalendarView] = useState(() => ({
    year: new Date().getFullYear(),
    month: new Date().getMonth(),
  }))
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  useEffect(() => {
    api
      .get<Appointment[]>('/appointments')
      .then((r) => setAppointments(Array.isArray(r.data) ? r.data : []))
      .catch(() => setAppointments([]))
      .finally(() => setLoading(false))
  }, [])

  const byDate = useMemo(
    () =>
      appointments.reduce<Record<string, Appointment[]>>((acc, a) => {
        const d = a.data
        if (!acc[d]) acc[d] = []
        acc[d].push(a)
        return acc
      }, {}),
    [appointments]
  )
  const dates = useMemo(() => Object.keys(byDate).sort(), [byDate])

  const nextAppointments = useMemo(() => {
    return appointments
      .filter(isAppointmentFuture)
      .sort((a, b) => (a.data === b.data ? a.horario.localeCompare(b.horario) : a.data.localeCompare(b.data)))
      .slice(0, 2)
  }, [appointments])

  const { startPad, days, year, month } = useMemo(
    () => getDaysInMonth(calendarView.year, calendarView.month),
    [calendarView]
  )

  const calendarGrid = useMemo(() => {
    const cells: { day: number | null; dateStr: string | null }[] = []
    for (let i = 0; i < startPad; i++) cells.push({ day: null, dateStr: null })
    for (let d = 1; d <= days; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      cells.push({ day: d, dateStr })
    }
    return cells
  }, [startPad, days, year, month])

  const daysWithAppointments = useMemo(() => {
    const set = new Set<string>()
    dates.forEach((d) => set.add(d))
    return set
  }, [dates])

  const appointmentsForSelectedDay = useMemo(() => {
    if (selectedDay === null) return []
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`
    return byDate[dateStr] ?? []
  }, [selectedDay, year, month, byDate])

  const prevMonth = () => {
    setCalendarView((prev) =>
      prev.month === 0 ? { year: prev.year - 1, month: 11 } : { year: prev.year, month: prev.month - 1 }
    )
    setSelectedDay(null)
  }
  const nextMonth = () => {
    setCalendarView((prev) =>
      prev.month === 11 ? { year: prev.year + 1, month: 0 } : { year: prev.year, month: prev.month + 1 }
    )
    setSelectedDay(null)
  }

  const hoje = new Date()
  const hojeStr = hoje.toISOString().slice(0, 10)
  const isToday = (dateStr: string | null) => dateStr === hojeStr

  return (
    <div className="px-4 lg:px-0 py-6 pb-24">
      <h1 className="text-xl lg:text-2xl font-bold text-gray-800 dark:text-night-text mb-1">Minha agenda</h1>
      <p className="text-sm text-gray-500 dark:text-night-muted mb-6">Próximas consultas, calendário e histórico</p>

      {loading ? (
        <>
          <CardSkeleton />
          <CardSkeleton />
        </>
      ) : (
        <div className="space-y-8">
          {/* Próximas consultas */}
          <section>
            <h2 className="text-xs font-semibold text-gray-500 dark:text-night-muted uppercase tracking-wider mb-3 flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Próximas consultas
            </h2>
            {nextAppointments.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-2xl bg-white dark:bg-night-card border border-gray-mist/50 dark:border-night-border p-5 text-center"
              >
                <Calendar className="h-10 w-10 text-gray-400 dark:text-night-muted mx-auto mb-2" />
                <p className="text-gray-600 dark:text-night-muted text-sm">Nenhuma consulta agendada</p>
                <p className="text-xs text-gray-500 dark:text-night-muted mt-1">Agende sua consulta com a Dra. Letícia</p>
                <Link href="/doctor" className="btn-primary inline-flex mt-4">
                  Agendar consulta
                </Link>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {nextAppointments.map((apt, i) => (
                  <motion.div
                    key={apt.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="rounded-2xl bg-olive/10 dark:bg-olive/15 border border-olive/20 dark:border-olive/30 p-4 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-night-text">{apt.tipo ?? 'Consulta'}</p>
                      <p className="text-sm text-gray-600 dark:text-night-muted mt-0.5">
                        {new Date(apt.data).toLocaleDateString('pt-BR', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                        })}{' '}
                        · {apt.horario}
                      </p>
                      {apt.observacoes && (
                        <p className="text-xs text-gray-500 dark:text-night-muted mt-1">{apt.observacoes}</p>
                      )}
                    </div>
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-xl shrink-0 ${
                        apt.status === 'confirmado'
                          ? 'bg-green-500/20 text-green-700 dark:text-green-400'
                          : 'bg-amber-500/20 text-amber-700 dark:text-amber-400'
                      }`}
                    >
                      {STATUS_LABEL[apt.status] ?? apt.status}
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
          </section>

          {/* Calendário */}
          <section>
            <h2 className="text-xs font-semibold text-gray-500 dark:text-night-muted uppercase tracking-wider mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Calendário
            </h2>
            <div className="rounded-2xl bg-white dark:bg-night-card shadow-soft border border-gray-mist/50 dark:border-night-border overflow-hidden">
              <div className="flex items-center justify-between px-3 py-3 border-b border-gray-mist/50 dark:border-night-border">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="p-2 rounded-xl hover:bg-gray-mist/50 dark:hover:bg-night-surface text-gray-600 dark:text-night-muted"
                  aria-label="Mês anterior"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="text-base font-bold text-gray-800 dark:text-night-text">
                  {MESES[month]} {year}
                </span>
                <button
                  type="button"
                  onClick={nextMonth}
                  className="p-2 rounded-xl hover:bg-gray-mist/50 dark:hover:bg-night-surface text-gray-600 dark:text-night-muted"
                  aria-label="Próximo mês"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
              <div className="grid grid-cols-7 text-center text-xs font-medium text-gray-500 dark:text-night-muted border-b border-gray-mist/50 dark:border-night-border">
                {WEEKDAYS.map((w) => (
                  <div key={w} className="py-2">
                    {w}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 p-1">
                {calendarGrid.map((cell, idx) => (
                  <button
                    key={idx}
                    type="button"
                    disabled={!cell.day}
                    onClick={() => cell.day && setSelectedDay(cell.day)}
                    className={`min-h-[40px] flex flex-col items-center justify-center text-sm rounded-lg transition-colors ${
                      !cell.day
                        ? 'invisible'
                        : selectedDay === cell.day
                          ? 'bg-olive text-white font-bold'
                          : cell.dateStr && daysWithAppointments.has(cell.dateStr)
                            ? 'bg-olive/15 dark:bg-olive/20 text-olive dark:text-olive-light font-medium hover:bg-olive/25'
                            : isToday(cell.dateStr)
                              ? 'ring-2 ring-olive/50 text-gray-800 dark:text-night-text'
                              : 'text-gray-700 dark:text-night-muted hover:bg-gray-mist/50 dark:hover:bg-night-surface'
                    }`}
                  >
                    {cell.day}
                    {cell.dateStr && daysWithAppointments.has(cell.dateStr) && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                          selectedDay === cell.day ? 'bg-white' : 'bg-olive dark:bg-olive-light'
                        }`}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {selectedDay !== null && appointmentsForSelectedDay.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-3 rounded-2xl bg-gray-mist/30 dark:bg-night-surface border border-gray-mist/50 dark:border-night-border p-4"
              >
                <p className="text-xs font-semibold text-gray-500 dark:text-night-muted uppercase tracking-wider mb-2">
                  {new Date(year, month, selectedDay).toLocaleDateString('pt-BR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })}
                </p>
                <div className="space-y-2">
                  {appointmentsForSelectedDay.map((apt) => (
                    <div
                      key={apt.id}
                      className="flex items-center justify-between py-2 border-b border-gray-200/50 dark:border-night-border last:border-0"
                    >
                      <div>
                        <p className="font-medium text-gray-800 dark:text-night-text">{apt.tipo ?? 'Consulta'}</p>
                        <p className="text-xs text-gray-600 dark:text-night-muted">{apt.horario}</p>
                      </div>
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-lg ${
                          apt.status === 'confirmado'
                            ? 'bg-green-500/20 text-green-700 dark:text-green-400'
                            : apt.status === 'cancelado'
                              ? 'bg-red-500/20 text-red-700 dark:text-red-400'
                              : 'bg-amber-500/20 text-amber-700 dark:text-amber-400'
                        }`}
                      >
                        {STATUS_LABEL[apt.status] ?? apt.status}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </section>

          {/* Lista por data (todas as consultas) */}
          {dates.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-gray-500 dark:text-night-muted uppercase tracking-wider mb-3">
                Todas as consultas
              </h2>
              <div className="space-y-4">
                {dates.map((date) => (
                  <div key={date}>
                    <p className="text-sm font-medium text-gray-600 dark:text-night-muted mb-2">
                      {new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                      })}
                    </p>
                    {byDate[date].map((apt) => (
                      <motion.div
                        key={apt.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="card-glass p-4 mb-3 flex items-center justify-between"
                      >
                        <div>
                          <p className="font-medium text-gray-800 dark:text-night-text">{apt.tipo ?? 'Consulta'}</p>
                          <p className="text-sm text-gray-600 dark:text-night-muted">{apt.horario}</p>
                          {apt.observacoes && (
                            <p className="text-xs text-gray-500 dark:text-night-muted mt-1">{apt.observacoes}</p>
                          )}
                        </div>
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded-xl shrink-0 ${
                            apt.status === 'confirmado'
                              ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400'
                              : apt.status === 'cancelado'
                                ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400'
                                : 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400'
                          }`}
                        >
                          {STATUS_LABEL[apt.status] ?? apt.status}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                ))}
              </div>
            </section>
          )}

          <div>
            <Link
              href="/doctor"
              className="flex items-center justify-between card-glass p-4 text-olive dark:text-olive-light font-medium"
            >
              Ver contatos da doutora
              <ChevronRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
