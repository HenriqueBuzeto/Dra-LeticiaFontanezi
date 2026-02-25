'use client'

import { useEffect, useState } from 'react'
import { Users as UsersIcon } from 'lucide-react'
import { api } from '@/lib/api'

type UserRow = { id: string; nome: string; email: string; role: string }

export default function AdminUsuarios() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get<UserRow[]>('/users')
      .then((r) => setUsers(Array.isArray(r.data) ? r.data : []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false))
  }, [])

  const pacientes = users.filter((u) => u.role === 'paciente')
  const admins = users.filter((u) => u.role === 'admin')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-night-text">Usuários</h1>
        <p className="text-gray-500 dark:text-night-muted text-sm mt-0.5">Pacientes e administradores cadastrados.</p>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-gray-mist/50 dark:border-night-border bg-white dark:bg-night-card p-12 text-center text-gray-500 dark:text-night-muted">
          Carregando...
        </div>
      ) : users.length === 0 ? (
        <div className="rounded-2xl border border-gray-mist/50 dark:border-night-border bg-white dark:bg-night-card p-12 text-center">
          <UsersIcon className="h-12 w-12 text-gray-400 dark:text-night-muted mx-auto mb-4" />
          <p className="text-gray-600 dark:text-night-muted">Nenhum usuário cadastrado.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-2xl bg-olive/10 dark:bg-olive/15 border border-olive/20 dark:border-olive/30 p-4">
              <p className="text-sm font-medium text-gray-600 dark:text-night-muted">Pacientes</p>
              <p className="text-2xl font-bold text-olive dark:text-olive-light">{pacientes.length}</p>
            </div>
            <div className="rounded-2xl bg-gray-mist/50 dark:bg-night-surface border border-gray-mist/50 dark:border-night-border p-4">
              <p className="text-sm font-medium text-gray-600 dark:text-night-muted">Administradores</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-night-text">{admins.length}</p>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-mist/50 dark:border-night-border bg-white dark:bg-night-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-mist/50 dark:border-night-border bg-gray-mist/30 dark:bg-night-surface">
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-night-muted uppercase">Nome</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-night-muted uppercase">E-mail</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-night-muted uppercase">Perfil</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-gray-mist/30 dark:border-night-border/50">
                      <td className="px-4 py-3 font-medium text-gray-800 dark:text-night-text">{u.nome}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-night-muted">{u.email}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-lg text-xs font-medium ${
                            u.role === 'admin' ? 'bg-olive/20 text-olive dark:text-olive-light' : 'bg-gray-mist/60 dark:bg-night-surface text-gray-600 dark:text-night-muted'
                          }`}
                        >
                          {u.role === 'admin' ? 'Admin' : 'Paciente'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
