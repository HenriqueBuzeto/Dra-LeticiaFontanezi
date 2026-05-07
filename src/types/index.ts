export type UserRole = 'admin' | 'paciente'

export type Genero = 'nao_informar' | 'feminino' | 'masculino' | 'outro'

export interface Endereco {
  cep?: string
  rua?: string
  numero?: string
  complemento?: string
  bairro?: string
  cidade?: string
  uf?: string
}

export interface ContatoEmergencia {
  nome?: string
  telefone?: string
  parentesco?: string
}

export interface User {
  id: string
  nome: string
  email: string
  telefone?: string
  telefoneAlternativo?: string
  dataNascimento?: string
  genero?: Genero
  role: UserRole
  avatar?: string
  endereco?: Endereco
  contatoEmergencia?: ContatoEmergencia
  preferenciaLembrete?: 'push' | 'email' | 'whatsapp'
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export type AppointmentStatus = 'confirmado' | 'pendente' | 'cancelado'

export type CheckinStatus = 'vai_comparecer' | 'nao_comparecer'

export interface Appointment {
  id: string
  userId: string
  data: string
  horario: string
  status: AppointmentStatus
  observacoes?: string
  tipo?: string
  checkinStatus?: CheckinStatus
  checkinAt?: string
}

export interface Reminder {
  id: string
  userId: string
  tipo: 'push' | 'email' | 'whatsapp'
  dataEnvio: string
  status: 'enviado' | 'pendente' | 'falhou'
  titulo?: string
  mensagem?: string
}

export interface Video {
  id: string
  titulo: string
  descricao?: string
  url: string
  thumbnail?: string
  categoria: 'higiene' | 'primeira_consulta' | 'cuidados_aparelho' | 'outros'
  duracao?: number
}

export interface ARSession {
  id: string
  userId: string
  corElastico?: string
  imagemUrl?: string
  createdAt: string
}

export interface DoctorInfo {
  nome: string
  especializacao: string
  bio: string
  foto: string
  avaliacao: number
  totalAvaliacoes: number
  whatsapp: string
  telefone: string
  endereco: string
  instagram?: string
  lat?: number
  lng?: number
  especialidades: string[]
}

export type PointAction =
  | 'escovacao'
  | 'fio_dental'
  | 'consulta_presente'
  | 'limpeza_bucal'
  | 'uso_enxaguante'
  | 'checkin_semanal'
  | 'reward_redeem'

export interface PointLog {
  id: string
  userId: string
  action: PointAction
  points: number
  metadata?: string
  createdAt: string
}

export interface PointsSummary {
  totalPoints: number
  recentLogs: PointLog[]
}

export interface RewardItem {
  id: string
  name: string
  pointsRequired: number
  type: 'escova' | 'kit' | 'consulta' | 'brinde'
  description: string
  imageUrl?: string | null
  quantity?: number
  active?: boolean
  category?: string | null
  featured?: boolean
}
