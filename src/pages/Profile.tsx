'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { User, LogOut, Camera, ChevronRight, Shield, Award, Bell } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/Toaster'
import { api } from '@/lib/api'
import type { Genero, Endereco, ContatoEmergencia, User as UserType } from '@/types'

const GENERO_OPTIONS: { value: Genero; label: string }[] = [
  { value: 'nao_informar', label: 'Não informar' },
  { value: 'feminino', label: 'Feminino' },
  { value: 'masculino', label: 'Masculino' },
  { value: 'outro', label: 'Outro' },
]

export default function Profile() {
  const { user, updateUser, logout } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [nome, setNome] = useState(user?.nome ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [telefone, setTelefone] = useState(user?.telefone ?? '')
  const [telefoneAlternativo, setTelefoneAlternativo] = useState(user?.telefoneAlternativo ?? '')
  const [dataNascimento, setDataNascimento] = useState(user?.dataNascimento ?? '')
  const [genero, setGenero] = useState<Genero>(user?.genero ?? 'nao_informar')
  const [endereco, setEndereco] = useState<Endereco>(user?.endereco ?? {})
  const [contatoEmergencia, setContatoEmergencia] = useState<ContatoEmergencia>(user?.contatoEmergencia ?? {})
  const [preferenciaLembrete, setPreferenciaLembrete] = useState(user?.preferenciaLembrete ?? 'push')
  const [avatar, setAvatar] = useState<string | undefined>(user?.avatar)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) return
    setNome(user.nome ?? '')
    setEmail(user.email ?? '')
    setTelefone(user.telefone ?? '')
    setTelefoneAlternativo(user.telefoneAlternativo ?? '')
    setDataNascimento(user.dataNascimento ?? '')
    setGenero(user.genero ?? 'nao_informar')
    setEndereco(user.endereco ?? {})
    setContatoEmergencia(user.contatoEmergencia ?? {})
    setPreferenciaLembrete(user.preferenciaLembrete ?? 'push')
    setAvatar(user.avatar)
  }, [user?.id])

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      setAvatar(dataUrl)
      updateUser({ avatar: dataUrl })
      toast('Foto atualizada', 'success')
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const removePhoto = () => {
    setAvatar(undefined)
    updateUser({ avatar: undefined })
    toast('Foto removida', 'info')
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const payload = {
      nome,
      email,
      telefone: telefone || undefined,
      telefoneAlternativo: telefoneAlternativo || undefined,
      dataNascimento: dataNascimento || undefined,
      genero,
      endereco: Object.keys(endereco).length ? endereco : undefined,
      contatoEmergencia: Object.values(contatoEmergencia).some(Boolean) ? contatoEmergencia : undefined,
      preferenciaLembrete,
      avatar,
    }
    const isDemo = typeof window !== 'undefined' && localStorage.getItem('accessToken') === 'demo-access-token'
    if (isDemo) {
      updateUser(payload as Partial<UserType>)
      toast('Perfil salvo (modo demo)', 'success')
      setSaving(false)
      return
    }
    const payloadForApi = { ...payload }
    if (typeof avatar === 'string' && avatar.startsWith('data:')) {
      delete (payloadForApi as Partial<UserType>).avatar
    }
    try {
      const { data } = await api.patch<UserType>('/users/me', payloadForApi)
      const keptAvatar = typeof avatar === 'string' && avatar.startsWith('data:') ? avatar : (data.avatar ?? avatar)
      updateUser({ ...data, avatar: keptAvatar })
      toast('Perfil salvo com sucesso', 'success')
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : 'Erro ao salvar perfil.'
      toast(msg || 'Erro ao salvar perfil.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    logout()
    router.replace('/auth/login')
  }

  return (
    <div className="px-4 lg:px-0 py-6 pb-24">
      <h1 className="text-xl lg:text-2xl font-bold text-gray-800 mb-6">Meu perfil</h1>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Foto e nome resumido */}
        <section className="rounded-2xl bg-white shadow-soft border border-gray-mist/50 p-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="relative group">
              <div className="w-24 h-24 rounded-2xl overflow-hidden bg-olive/10 flex items-center justify-center shrink-0">
                {avatar ? (
                  <img src={avatar} alt="Sua foto" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold text-olive">
                    {user?.nome?.split(' ').map((n) => n[0]).join('').slice(0, 2) ?? '?'}
                  </span>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-9 h-9 rounded-xl bg-olive text-white flex items-center justify-center shadow-lg hover:bg-olive-dark transition-colors"
                aria-label="Alterar foto do perfil"
              >
                <Camera className="h-4 w-4" />
              </button>
              {avatar && (
                <button
                  type="button"
                  onClick={removePhoto}
                  className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center hover:bg-red-600"
                  aria-label="Remover foto"
                >
                  ×
                </button>
              )}
            </div>
            <div className="text-center sm:text-left flex-1">
              <p className="text-sm text-gray-500 mb-1">Foto do perfil</p>
              <p className="text-xs text-gray-400">Toque no ícone da câmera para alterar ou remover</p>
            </div>
          </div>
        </section>

        {/* Dados pessoais */}
        <section>
          <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <User className="h-4 w-4 text-olive" />
            Dados pessoais
          </h2>
          <div className="rounded-2xl bg-white shadow-soft border border-gray-mist/50 p-4 sm:p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo *</label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                className="input-field"
                placeholder="Seu nome completo"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data de nascimento</label>
                <input
                  type="date"
                  value={dataNascimento}
                  onChange={(e) => setDataNascimento(e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gênero</label>
                <select
                  value={genero}
                  onChange={(e) => setGenero(e.target.value as Genero)}
                  className="input-field"
                >
                  {GENERO_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Contato */}
        <section>
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Contato</h2>
          <div className="rounded-2xl bg-white shadow-soft border border-gray-mist/50 p-4 sm:p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-mail *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-field"
                placeholder="seu@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
              <input
                type="tel"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                className="input-field"
                placeholder="(11) 99999-9999"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefone alternativo (opcional)</label>
              <input
                type="tel"
                value={telefoneAlternativo}
                onChange={(e) => setTelefoneAlternativo(e.target.value)}
                className="input-field"
                placeholder="(11) 3333-4444"
              />
            </div>
          </div>
        </section>

        {/* Endereço (opcional) */}
        <section>
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Endereço (opcional)</h2>
          <div className="rounded-2xl bg-white shadow-soft border border-gray-mist/50 p-4 sm:p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
                <input
                  type="text"
                  value={endereco.cep ?? ''}
                  onChange={(e) => setEndereco((p) => ({ ...p, cep: e.target.value }))}
                  className="input-field"
                  placeholder="00000-000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">UF</label>
                <input
                  type="text"
                  value={endereco.uf ?? ''}
                  onChange={(e) => setEndereco((p) => ({ ...p, uf: e.target.value }))}
                  className="input-field"
                  placeholder="SP"
                  maxLength={2}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rua</label>
              <input
                type="text"
                value={endereco.rua ?? ''}
                onChange={(e) => setEndereco((p) => ({ ...p, rua: e.target.value }))}
                className="input-field"
                placeholder="Nome da rua"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
                <input
                  type="text"
                  value={endereco.numero ?? ''}
                  onChange={(e) => setEndereco((p) => ({ ...p, numero: e.target.value }))}
                  className="input-field"
                  placeholder="123"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Complemento</label>
                <input
                  type="text"
                  value={endereco.complemento ?? ''}
                  onChange={(e) => setEndereco((p) => ({ ...p, complemento: e.target.value }))}
                  className="input-field"
                  placeholder="Apto 45"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bairro</label>
                <input
                  type="text"
                  value={endereco.bairro ?? ''}
                  onChange={(e) => setEndereco((p) => ({ ...p, bairro: e.target.value }))}
                  className="input-field"
                  placeholder="Bairro"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
              <input
                type="text"
                value={endereco.cidade ?? ''}
                onChange={(e) => setEndereco((p) => ({ ...p, cidade: e.target.value }))}
                className="input-field"
                placeholder="São Paulo"
              />
            </div>
          </div>
        </section>

        {/* Contato de emergência (opcional) */}
        <section>
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Contato de emergência (opcional)</h2>
          <div className="rounded-2xl bg-white shadow-soft border border-gray-mist/50 p-4 sm:p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
              <input
                type="text"
                value={contatoEmergencia.nome ?? ''}
                onChange={(e) => setContatoEmergencia((p) => ({ ...p, nome: e.target.value }))}
                className="input-field"
                placeholder="Nome do contato"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                <input
                  type="tel"
                  value={contatoEmergencia.telefone ?? ''}
                  onChange={(e) => setContatoEmergencia((p) => ({ ...p, telefone: e.target.value }))}
                  className="input-field"
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parentesco</label>
                <input
                  type="text"
                  value={contatoEmergencia.parentesco ?? ''}
                  onChange={(e) => setContatoEmergencia((p) => ({ ...p, parentesco: e.target.value }))}
                  className="input-field"
                  placeholder="Ex: Cônjuge, Pai, Mãe"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Preferências */}
        <section>
          <h2 className="text-sm font-semibold text-gray-700 dark:text-night-text mb-4">Preferências</h2>
          <div className="relative rounded-2xl overflow-hidden bg-white dark:bg-night-card border border-luxury-warmGray/50 dark:border-night-border p-5 sm:p-6 shadow-[0_4px_20px_rgba(131,167,129,0.06)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.25)] transition-all duration-300 hover:shadow-glass hover:border-olive/20 dark:hover:border-olive/30">
            <div className="absolute top-0 right-0 w-32 h-32 bg-olive/5 dark:bg-olive/10 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" aria-hidden="true" />
            <div className="relative flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-olive/10 dark:bg-olive/20 flex items-center justify-center shrink-0">
                <Bell className="h-5 w-5 text-olive dark:text-olive-light" />
              </div>
              <div className="flex-1 min-w-0">
                <label className="block text-sm font-medium text-gray-800 dark:text-night-text mb-2">Como prefere receber lembretes?</label>
                <select
                  value={preferenciaLembrete}
                  onChange={(e) => setPreferenciaLembrete(e.target.value as 'push' | 'email' | 'whatsapp')}
                  className="w-full px-4 py-3.5 pr-10 rounded-xl border-2 border-luxury-warmGray/60 dark:border-night-border bg-offwhite/50 dark:bg-night-surface text-gray-800 dark:text-night-text font-medium outline-none transition-all duration-200 focus:border-olive focus:ring-2 focus:ring-olive/20 dark:focus:border-olive-light dark:focus:ring-olive/30 appearance-none cursor-pointer bg-[length:20px] bg-[right_12px_center] bg-no-repeat"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%2383a781' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")` }}
                >
                  <option value="push">Push (notificação no celular)</option>
                  <option value="email">E-mail</option>
                  <option value="whatsapp">WhatsApp</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        <div className="flex flex-col sm:flex-row gap-3">
          <button type="submit" disabled={saving} className="btn-primary flex-1">
            {saving ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </div>
      </form>

      {/* Privacidade */}
      <div className="mt-6 flex items-start gap-3 rounded-2xl bg-gray-mist/30 border border-gray-mist/50 p-4">
        <Shield className="h-5 w-5 text-olive shrink-0 mt-0.5" />
        <div className="text-sm text-gray-600">
          <p className="font-medium text-gray-800">Seus dados estão seguros</p>
          <p className="mt-0.5">As informações do perfil são usadas apenas para seu atendimento e não são compartilhadas com terceiros.</p>
        </div>
      </div>

      {/* Links e sair */}
      <div className="mt-8 space-y-2">
        <Link
          href="/pontos"
          className="flex items-center justify-between rounded-2xl bg-white shadow-soft border border-gray-mist/50 p-4 text-gray-800 font-medium dark:bg-night-card dark:border-night-border dark:text-night-text"
        >
          <span className="flex items-center gap-3">
            <Award className="h-5 w-5 text-olive" />
            Meus pontos e recompensas
          </span>
          <ChevronRight className="h-5 w-5 text-olive" />
        </Link>
        <Link
          href="/doctor"
          className="flex items-center justify-between rounded-2xl bg-white shadow-soft border border-gray-mist/50 p-4 text-gray-800 font-medium dark:bg-night-card dark:border-night-border dark:text-night-text"
        >
          Sobre a doutora
          <ChevronRight className="h-5 w-5 text-olive" />
        </Link>
        <motion.button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-between rounded-2xl bg-white shadow-soft border border-red-200 p-4 text-red-600 font-medium"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          Sair da conta
          <LogOut className="h-5 w-5" />
        </motion.button>
      </div>
    </div>
  )
}
