'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Check,
  Flame,
  HeartHandshake,
  HelpCircle,
  ListChecks,
  Play,
  ShieldAlert,
  Sparkles,
  Star,
  Timer,
  Wand2,
} from 'lucide-react'
import Link from 'next/link'

type SectionId =
  | 'top'
  | 'faq'
  | 'checklist'
  | 'adaptacao'
  | 'dor-aftas'
  | 'alimentacao'
  | 'higiene'
  | 'elasticos'
  | 'provisorio'
  | 'cores'
  | 'videos'

function scrollToId(id: SectionId) {
  const el = document.getElementById(id)
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function SectionHeading({ kicker, title, subtitle }: { kicker?: string; title: string; subtitle?: string }) {
  return (
    <div className="space-y-1.5">
      {kicker ? <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{kicker}</p> : null}
      <h2 className="text-lg lg:text-xl font-bold text-gray-900 dark:text-gray-100">{title}</h2>
      {subtitle ? <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{subtitle}</p> : null}
    </div>
  )
}

function PillButton({
  label,
  icon: Icon,
  onClick,
}: {
  label: string
  icon: React.ComponentType<{ className?: string }>
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/85 dark:bg-night-card border border-gray-mist/50 dark:border-night-border shadow-soft text-gray-800 dark:text-gray-100 text-sm font-medium hover:shadow-glass transition"
    >
      <Icon className="h-4 w-4 text-olive" />
      {label}
      <ArrowRight className="h-4 w-4 text-gray-400" />
    </button>
  )
}

function InfoCard({
  icon: Icon,
  title,
  description,
  badge,
  tone = 'default',
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  badge?: string
  tone?: 'default' | 'warn'
}) {
  return (
    <div
      className={`rounded-2xl border p-4 shadow-soft bg-white/85 dark:bg-night-card backdrop-blur-md ${
        tone === 'warn'
          ? 'border-rose-200/70 dark:border-rose-300/20'
          : 'border-gray-mist/50 dark:border-night-border'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            tone === 'warn' ? 'bg-rose-50 text-rose-600' : 'bg-olive/10 text-olive'
          }`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-gray-900 dark:text-gray-100">{title}</p>
            {badge ? (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-olive/10 text-olive font-semibold">{badge}</span>
            ) : null}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mt-1">{description}</p>
        </div>
      </div>
    </div>
  )
}

function AccordionItem({
  question,
  answer,
  open,
  onToggle,
}: {
  question: string
  answer: string
  open: boolean
  onToggle: () => void
}) {
  return (
    <div className="rounded-2xl border border-gray-mist/50 dark:border-night-border bg-white/85 dark:bg-night-card shadow-soft overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-start justify-between gap-4 p-4 text-left"
        aria-expanded={open}
      >
        <span className="font-semibold text-gray-900 dark:text-gray-100">{question}</span>
        <span
          className={`mt-0.5 inline-flex items-center justify-center w-8 h-8 rounded-xl border border-gray-mist/60 dark:border-night-border text-gray-600 dark:text-gray-300 transition-transform ${
            open ? 'rotate-45' : ''
          }`}
          aria-hidden="true"
        >
          +
        </span>
      </button>
      {open ? <div className="px-4 pb-4 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{answer}</div> : null}
    </div>
  )
}

function ColorSwatch({
  name,
  hex,
  selected,
  onSelect,
}: {
  name: string
  hex: string
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group flex items-center justify-between gap-3 w-full rounded-2xl border px-3.5 py-3 text-left transition ${
        selected
          ? 'border-olive bg-olive/10'
          : 'border-gray-mist/50 dark:border-night-border bg-white/80 dark:bg-night-card hover:bg-gray-mist/30 dark:hover:bg-night-surface'
      }`}
    >
      <span className="flex items-center gap-3 min-w-0">
        <span
          className={`w-6 h-6 rounded-full border border-black/10 shadow-sm`}
          style={{ backgroundColor: hex }}
          aria-hidden="true"
        />
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{name}</span>
      </span>
      {selected ? <Check className="h-4 w-4 text-olive" /> : <span className="text-xs text-gray-400">Selecionar</span>}
    </button>
  )
}

export function OrthodonticManual({
  whatsappUrl,
  schedulingHref,
}: {
  whatsappUrl?: string
  schedulingHref?: string
}) {
  const [faqOpen, setFaqOpen] = useState<number | null>(0)

  const [checklist, setChecklist] = useState(() => ({
    escovar: false,
    fio: false,
    interdental: false,
    evitar: false,
    naoCortar: false,
    elasticos: false,
    contato: false,
    manutencoes: false,
    naoFaltar: false,
  }))

  const checklistProgress = useMemo(() => {
    const values = Object.values(checklist)
    const done = values.filter(Boolean).length
    return {
      done,
      total: values.length,
      percent: Math.round((done / values.length) * 100),
    }
  }, [checklist])

  const colors = useMemo(
    () =>
      [
        { name: 'Verde Mar', hex: '#1AAE8F' },
        { name: 'Verde Cristal', hex: '#42C7AE' },
        { name: 'Verde Pérola', hex: '#A6E6D9' },
        { name: 'Verde Musgo', hex: '#4B6F5A' },
        { name: 'Azul', hex: '#2F6FDB' },
        { name: 'Azul Bebê', hex: '#9CCBFF' },
        { name: 'Azul Cristal', hex: '#79B6FF' },
        { name: 'Azul Marinho', hex: '#1B2E67' },
        { name: 'Amarelo', hex: '#F7C948' },
        { name: 'Amarelo Cristal', hex: '#FFE38B' },
        { name: 'Amarelo Limão', hex: '#D7F000' },
        { name: 'Branco', hex: '#FFFFFF' },
        { name: 'Cristal', hex: '#E8F1F6' },
        { name: 'Cinza', hex: '#A0A4AB' },
        { name: 'Dourado', hex: '#C9A227' },
        { name: 'Laranja', hex: '#FF8A3D' },
        { name: 'Laranja Cristal', hex: '#FFC0A1' },
        { name: 'Lilás', hex: '#B38BFF' },
        { name: 'Preto', hex: '#111827' },
        { name: 'Prata', hex: '#C8CDD5' },
        { name: 'Azul Pérola', hex: '#C4DAFF' },
        { name: 'Pérola', hex: '#F2F1EC' },
        { name: 'Pink Cristal', hex: '#FF9DD6' },
        { name: 'Rosa Pink', hex: '#FF3EA5' },
        { name: 'Rosa Cristal', hex: '#FFC6E4' },
        { name: 'Rosa Bebê', hex: '#FFD0E6' },
        { name: 'Roxo', hex: '#6D28D9' },
        { name: 'Uva Cristal', hex: '#C4B5FD' },
        { name: 'Vermelho', hex: '#EF4444' },
        { name: 'Vermelho Cristal', hex: '#FCA5A5' },
        { name: 'Vinho', hex: '#7F1D1D' },
      ] as const,
    [],
  )

  const [selectedColor, setSelectedColor] = useState<(typeof colors)[number] | null>(colors[0] ?? null)

  const durableColors = useMemo(
    () => ['Preto', 'Verde Mar', 'Verde Musgo', 'Azul', 'Azul Marinho', 'Rosa Pink', 'Roxo', 'Vermelho', 'Vinho'],
    [],
  )

  const fragileColors = useMemo(() => ['Azul Bebê', 'Branco', 'Cristal', 'Pérola', 'Azul Pérola', 'Rosa Bebê'], [])

  const videoCards = useMemo(
    () =>
      [
        { title: 'Como usar a cera ortodôntica', description: 'Conforto imediato quando algo machuca.' },
        { title: 'Como passar fio dental com passa fio', description: 'O passo que mais evita cáries e gengivite.' },
        { title: 'Como usar escova interdental', description: 'Limpeza entre braquetes e fio de aço.' },
        { title: 'Como cuidar dos elásticos', description: 'O que muda o encaixe da mordida.' },
        { title: 'O que fazer quando o fio machuca', description: 'O que é normal e quando chamar a clínica.' },
        { title: 'O que evitar comer usando aparelho', description: 'Evite quebras e atrasos no tratamento.' },
      ] as const,
    [],
  )

  const faq = useMemo(
    () =>
      [
        {
          q: 'Por que no dia da manutenção só foi feita a troca das borrachinhas e não a troca do fio?',
          a: 'Muitos pacientes acham que o tratamento só evolui quando há troca do fio, mas isso é mito. Muitas vezes mantemos o fio para que ele termine a movimentação que está sendo feita. Trocar antes da hora pode causar danos às raízes dos dentes.',
        },
        {
          q: 'É normal sobrar pontinha do fio lá no fundo no decorrer do mês?',
          a: 'Sim. Conforme os dentes vão se alinhando, é normal o fio começar a sobrar no fundo. Se estiver machucando, use cera ortodôntica para conforto e entre em contato para ajuste. Não corte o fio em casa.',
        },
        {
          q: 'Estou com a sensação de que meu dente está mole depois que coloquei o aparelho. É normal?',
          a: 'Sim. Quando colocamos o aparelho, os dentes precisam se movimentar. Essa sensação de “mole” faz parte do processo. Depois que os dentes chegam aos lugares corretos, eles ficam firmes novamente.',
        },
        {
          q: 'Por que abriu espacinho entre meus dentes?',
          a: 'Durante o alinhamento, em alguns casos o aparelho cria pequenos espaços entre os dentes para alinhar tudo corretamente. Depois, esses espaços são fechados nas próximas etapas do tratamento.',
        },
      ] as const,
    [],
  )

  return (
    <div className="space-y-10" id="top">
      <section className="relative rounded-3xl overflow-hidden border border-gray-mist/50 dark:border-night-border bg-gradient-hero shadow-soft">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-olive/15 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-accent-purple/15 blur-3xl" />
        </div>

        <div className="relative p-5 sm:p-7 lg:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Manual do Paciente Ortodôntico</p>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                Seu guia completo durante o tratamento ortodôntico
              </h1>
              <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed mt-3">
                O aparelho funciona melhor quando paciente e dentista caminham juntos. Aqui você encontra orientações simples para cuidar
                do seu sorriso todos os dias.
              </p>

              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2.5 mt-5">
                <PillButton label="Começar guia" icon={BookOpen} onClick={() => scrollToId('adaptacao')} />
                <PillButton label="Ver dúvidas frequentes" icon={HelpCircle} onClick={() => scrollToId('faq')} />
                <PillButton label="Checklist de cuidados" icon={ListChecks} onClick={() => scrollToId('checklist')} />
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                Dica: salve esta página nos favoritos para consultar sempre que surgir uma dúvida.
              </p>
            </div>

            <div className="w-full lg:w-[340px]">
              <div className="card-glass p-4 sm:p-5">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-olive/15 flex items-center justify-center">
                    <HeartHandshake className="h-5 w-5 text-olive" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Objetivo do tratamento</p>
                    <p className="text-xs text-gray-600 dark:text-gray-300">Conforto, segurança e evolução constante.</p>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                    <BadgeCheck className="h-4 w-4 text-olive" />
                    Passo a passo para o dia a dia
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                    <ListChecks className="h-4 w-4 text-olive" />
                    Checklist “paciente nota 10”
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                    <ShieldAlert className="h-4 w-4 text-olive" />
                    Alertas do que não fazer
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-2">
                  {whatsappUrl ? (
                    <motion.a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary text-center text-sm py-2.5"
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      WhatsApp
                    </motion.a>
                  ) : (
                    <span className="btn-primary text-center text-sm py-2.5 opacity-60 cursor-not-allowed">WhatsApp</span>
                  )}

                  {schedulingHref ? (
                    <Link href={schedulingHref} className="btn-secondary text-center text-sm py-2.5">
                      Agendar
                    </Link>
                  ) : (
                    <span className="btn-secondary text-center text-sm py-2.5 opacity-60 cursor-not-allowed">Agendar</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading
          kicker="Gamificação"
          title="Sua jornada com aparelho"
          subtitle="Pense em cada etapa como uma missão. Quando você faz o básico bem feito, o tratamento flui mais rápido e com menos imprevistos."
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <InfoCard
            icon={Timer}
            title="Missão 1: sobreviver aos primeiros 10 dias"
            description="É a fase de adaptação. O desconforto é comum e passa — a constância nos cuidados é o que faz diferença."
            badge="Essencial"
          />
          <InfoCard
            icon={Sparkles}
            title="Missão 2: aprender a higienização correta"
            description={'Uma boa higiene evita cáries, inflamações e manchas. É o "power-up" do tratamento.'}
            badge="Cuidado diário"
          />
          <InfoCard
            icon={Flame}
            title="Missão 3: evitar alimentos que quebram o aparelho"
            description="Quebras geram emergências e atrasos. Corte alimentos firmes em pedaços pequenos."
            badge="Evita atraso"
          />
          <InfoCard
            icon={Wand2}
            title="Missão 4: usar elásticos corretamente (quando indicado)"
            description="Elásticos são parte ativa do tratamento. Sem uso correto, os dentes podem voltar e o tempo aumenta."
            badge="Evita atraso"
          />
          <InfoCard
            icon={HelpCircle}
            title="Missão 5: tirar dúvidas antes de agir por conta própria"
            description="Em caso de incômodo, peça solta ou ferida, fale com a clínica. O improviso costuma piorar."
            badge="Segurança"
          />
          <InfoCard
            icon={Star}
            title="Missão 6: escolher a cor das borrachinhas"
            description="A parte divertida. Você escolhe, a gente cuida do resto — e juntos mantemos o tratamento no ritmo."
            badge="Bônus"
          />
        </div>
      </section>

      <section className="space-y-4" id="adaptacao">
        <SectionHeading
          kicker="1. Fase de adaptação"
          title="O que esperar?"
          subtitle="Nos primeiros 7 a 10 dias, seu corpo está se adaptando à presença do aparelho."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <InfoCard icon={BadgeCheck} title="Pressão nos dentes" description="Sensação de pressão e sensibilidade ao mastigar pode aparecer." />
          <InfoCard icon={BadgeCheck} title="Sensibilidade ao mastigar" description="Prefira alimentos mais macios nos primeiros dias." />
          <InfoCard icon={BadgeCheck} title="Pequena mobilidade" description="A sensação de “dente mole” pode acontecer e costuma ser esperada." />
          <InfoCard
            icon={BadgeCheck}
            title="Incômodo com fio ou braquete"
            description="No início os dentes podem se mover rápido e sobrar pontinha de fio no fundo."
          />
        </div>

        <InfoCard
          tone="warn"
          icon={ShieldAlert}
          title="Atenção"
          description="Nunca corte o fio em casa. Entre em contato com a clínica para ajuste seguro."
          badge="Importante"
        />
      </section>

      <section className="space-y-4" id="dor-aftas">
        <SectionHeading kicker="Conforto" title="O que fazer em caso de dor ou aftas?" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <InfoCard
            icon={ShieldAlert}
            title="Medicamentos"
            description="Use apenas medicamentos prescritos pela dentista durante a consulta. Não se automedique."
            badge="Segurança"
          />
          <InfoCard
            icon={Sparkles}
            title="Cera ortodôntica"
            description="Se o braquete ou fio estiver machucando, seque a região, pegue uma pequena bolinha de cera e coloque sobre a peça que incomoda."
            badge="Alívio rápido"
          />
        </div>

        <div className="card-glass p-4 sm:p-5">
          <p className="font-semibold text-gray-900 dark:text-gray-100">Passo a passo da cera</p>
          <ol className="mt-3 space-y-2 text-sm text-gray-700 dark:text-gray-300">
            {[
              'Identifique onde está machucando.',
              'Seque bem a região.',
              'Faça uma pequena bolinha de cera.',
              'Aplique sobre o braquete ou fio.',
              'Pressione levemente para fixar.',
            ].map((t) => (
              <li key={t} className="flex items-start gap-2">
                <span className="mt-0.5 w-5 h-5 rounded-lg bg-olive/15 text-olive flex items-center justify-center text-xs font-bold">
                  <Check className="h-3.5 w-3.5" />
                </span>
                <span>{t}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <InfoCard
            icon={Sparkles}
            title="Omcilon A-Orabase"
            description="Quando indicado, aplique pequena quantidade com cotonete sobre a ferida, sem esfregar. Ele forma uma película protetora."
          />
          <InfoCard
            icon={Sparkles}
            title="Bochecho com água morna e sal"
            description="Use um copo de água morna com uma colher de chá de sal. Faça bochechos 3 vezes ao dia por até 5 dias."
          />
        </div>

        <InfoCard
          tone="warn"
          icon={ShieldAlert}
          title="Quando chamar a clínica"
          description="Se a dor persistir, houver ferida grande, sangramento ou peça solta, entre em contato com a clínica."
          badge="Não espere"
        />
      </section>

      <section className="space-y-4" id="alimentacao">
        <SectionHeading kicker="2. Cuidados" title="Alimentação e hábitos" subtitle="Quebras atrasam o tratamento e podem gerar urgências." />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="card-glass p-4 sm:p-5">
            <p className="font-semibold text-gray-900 dark:text-gray-100">Pode comer com cuidado</p>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
              Se for comer alimentos firmes (maçã, carne), corte em pedaços pequenos antes de mastigar.
            </p>
          </div>
          <div className="card-glass p-4 sm:p-5">
            <p className="font-semibold text-gray-900 dark:text-gray-100">Evite durante o tratamento</p>
            <ul className="text-sm text-gray-700 dark:text-gray-300 mt-3 space-y-1.5">
              {['Balas duras', 'Pirulito', 'Torresmo', 'Amendoim', 'Chiclete', 'Alimentos muito pegajosos'].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-olive" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="card-glass p-4 sm:p-5">
            <p className="font-semibold text-gray-900 dark:text-gray-100">Hábitos que quebram o aparelho</p>
            <ul className="text-sm text-gray-700 dark:text-gray-300 mt-3 space-y-1.5">
              {['Morder objetos', 'Roer unha', 'Morder tampa de caneta'].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-olive" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <InfoCard
          tone="warn"
          icon={ShieldAlert}
          title="Alerta"
          description="Peças quebradas podem atrasar o tratamento e aumentar o tempo de uso do aparelho."
          badge="Evite" 
        />
      </section>

      <section className="space-y-4" id="higiene">
        <SectionHeading
          kicker="Ritual"
          title="Higienização passo a passo"
          subtitle="Uma boa higienização evita cáries e inflamações na gengiva, que podem atrasar o tratamento e gerar problemas sérios."
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <InfoCard
            icon={ListChecks}
            title="1º passo: fio dental com passa fio"
            description="Separe o passa fio, introduza o fio, passe por trás do fio do aparelho e limpe entre os dentes suavemente."
            badge="Todos os dias"
          />
          <InfoCard
            icon={ListChecks}
            title="2º passo: escovação com escova macia"
            description="Escove em movimentos circulares e inclinados para limpar dentes e braquetes. Não esqueça a parte de trás."
          />
          <InfoCard
            icon={ListChecks}
            title="3º passo: escova interdental"
            description="Insira a escovinha por trás do fio de aço, de cima para baixo, limpando as laterais de cada braquete."
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div className="card-glass p-4 sm:p-5">
            <p className="font-semibold text-gray-900 dark:text-gray-100">Sugestões de escovas</p>
            <ul className="mt-3 text-sm text-gray-700 dark:text-gray-300 space-y-1.5">
              {['Powerdent Linha Supreme', 'Colgate Slim Soft', 'Dentalclean Dupla Ação Ortodôntica', 'Oral-B Iconic Premium'].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-olive" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="card-glass p-4 sm:p-5">
            <p className="font-semibold text-gray-900 dark:text-gray-100">Sugestões de pastas</p>
            <ul className="mt-3 text-sm text-gray-700 dark:text-gray-300 space-y-1.5">
              {['Colgate OrthoGard', 'Curaprox Enzycal', 'Colgate Sensitive', 'Elmex Sensitive'].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-olive" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="card-glass p-4 sm:p-5" id="checklist">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Checklist visual</p>
              <p className="font-bold text-gray-900 dark:text-gray-100">Rotina de higiene</p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                Marque os itens para acompanhar sua constância (salvo apenas no seu dispositivo).
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{checklistProgress.percent}%</p>
              <p className="text-xs text-gray-500">{checklistProgress.done}/{checklistProgress.total}</p>
            </div>
          </div>

          <div className="mt-4 h-2 rounded-full bg-gray-mist/60 overflow-hidden" aria-hidden="true">
            <div className="h-full bg-gradient-premium" style={{ width: `${checklistProgress.percent}%` }} />
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              { key: 'fio', label: 'Usei fio dental' },
              { key: 'escovar', label: 'Escovei todas as faces dos dentes' },
              { key: 'interdental', label: 'Usei escova interdental' },
              { key: 'naoCortar', label: 'Não cortei fio em casa' },
              { key: 'contato', label: 'Entrei em contato se algo machucou' },
            ].map((it) => (
              <label
                key={it.key}
                className="flex items-center gap-3 rounded-2xl border border-gray-mist/50 dark:border-night-border bg-white/70 dark:bg-night-surface px-3.5 py-3"
              >
                <input
                  type="checkbox"
                  checked={checklist[it.key as keyof typeof checklist]}
                  onChange={(e) =>
                    setChecklist((s) => ({
                      ...s,
                      [it.key]: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 accent-olive"
                />
                <span className="text-sm text-gray-800 dark:text-gray-100">{it.label}</span>
              </label>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-4" id="elasticos">
        <SectionHeading
          kicker="3. Importante"
          title="Uso dos elásticos"
          subtitle="Os elásticos fazem parte ativa do tratamento para corrigir a mordida e o encaixe dos dentes."
        />

        <InfoCard
          tone="warn"
          icon={ShieldAlert}
          title="Destaque"
          description="Se você não usar como recomendado, os dentes podem voltar à posição anterior. O uso negligente dos elásticos é um dos maiores motivos de atraso na retirada do aparelho."
          badge="Evita atraso"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            'Use exatamente como orientado.',
            'Remova apenas quando indicado.',
            'Troque conforme recomendação.',
            'Não use elásticos de outra pessoa.',
            'Avise a clínica se acabar.',
          ].map((t) => (
            <div key={t} className="rounded-2xl border border-gray-mist/50 dark:border-night-border bg-white/85 dark:bg-night-card p-4">
              <div className="flex items-start gap-2">
                <Check className="h-4 w-4 text-olive mt-0.5" />
                <p className="text-sm text-gray-800 dark:text-gray-100">{t}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4" id="provisorio">
        <SectionHeading kicker="Atenção" title="Orientações para quem usa dente provisório" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <InfoCard
            icon={BadgeCheck}
            title="Instabilidade"
            description="É normal apresentar leve mobilidade ou parecer solto. Ele é estético, temporário e preso ao fio."
          />
          <InfoCard icon={BadgeCheck} title="Cuidados" description="Evite morder alimentos duros diretamente sobre ele." />
          <InfoCard
            icon={BadgeCheck}
            title="Higiene"
            description="Tenha cuidado redobrado ao passar fio dental ao redor para não descolar." 
          />
          <InfoCard icon={BadgeCheck} title="Lembre-se" description="É apenas um dente estético temporário." />
        </div>
      </section>

      <section className="space-y-4" id="faq">
        <SectionHeading kicker="FAQ" title="Dúvidas frequentes" subtitle="Respostas diretas para dúvidas comuns durante o mês." />

        <div className="space-y-2">
          {faq.map((it, idx) => (
            <AccordionItem
              key={it.q}
              question={it.q}
              answer={it.a}
              open={faqOpen === idx}
              onToggle={() => setFaqOpen((cur) => (cur === idx ? null : idx))}
            />
          ))}
        </div>
      </section>

      <section className="space-y-4" id="cores">
        <SectionHeading kicker="Bônus" title="Escolha sua cor favorita" subtitle="Clique para ver um preview e receber uma mensagem divertida." />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {colors.map((c) => (
              <ColorSwatch
                key={c.name}
                name={c.name}
                hex={c.hex}
                selected={selectedColor?.name === c.name}
                onSelect={() => setSelectedColor(c)}
              />
            ))}
          </div>

          <div className="card-glass p-5 space-y-3">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Preview</p>
            <div className="rounded-3xl border border-gray-mist/50 dark:border-night-border bg-white/80 dark:bg-night-surface p-4">
              <div className="flex items-center gap-3">
                <span
                  className="w-10 h-10 rounded-2xl border border-black/10 shadow-sm"
                  style={{ backgroundColor: selectedColor?.hex ?? '#E8E6E1' }}
                  aria-hidden="true"
                />
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{selectedColor?.name ?? 'Escolha uma cor'}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-300">Boa escolha! Essa cor combina com seu próximo mês de tratamento.</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-mist/50 dark:border-night-border bg-white/70 dark:bg-night-surface p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Dica de durabilidade</p>
              <div className="mt-2 space-y-1 text-sm">
                <p className="text-gray-800 dark:text-gray-100">
                  <span className="font-semibold">Maior durabilidade:</span> {durableColors.join(', ')}
                </p>
                <p className="text-gray-800 dark:text-gray-100">
                  <span className="font-semibold">Menor durabilidade:</span> {fragileColors.join(', ')}
                </p>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Consumo de comidas e bebidas pigmentadas pode interferir na durabilidade da cor.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4" id="videos">
        <SectionHeading kicker="Conteúdo" title="Vídeos rápidos para te ajudar" subtitle="Cards prontos para receber links (YouTube) quando você quiser." />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {videoCards.map((v) => (
            <div key={v.title} className="rounded-2xl overflow-hidden border border-gray-mist/50 dark:border-night-border bg-white/85 dark:bg-night-card shadow-soft">
              <div className="aspect-video bg-gradient-to-br from-olive/10 via-white/40 to-accent-purple/10 flex items-center justify-center">
                <div className="w-12 h-12 rounded-2xl bg-white/90 shadow-soft flex items-center justify-center">
                  <Play className="h-6 w-6 text-olive" fill="currentColor" />
                </div>
              </div>
              <div className="p-4">
                <p className="font-semibold text-gray-900 dark:text-gray-100">{v.title}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">{v.description}</p>
                <p className="text-xs text-gray-400 mt-3">Em breve</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-gray-mist/50 dark:border-night-border bg-white/85 dark:bg-night-card shadow-soft overflow-hidden">
        <div className="p-5 sm:p-6">
          <SectionHeading
            kicker="Fechamento"
            title="Está com dúvida ou sentindo incômodo?"
            subtitle="Não tente resolver sozinho. Fale com a clínica para receber a orientação correta."
          />

          <div className="mt-5 flex flex-col sm:flex-row gap-2">
            {whatsappUrl ? (
              <motion.a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary w-full sm:w-auto text-center"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
              >
                Chamar no WhatsApp
              </motion.a>
            ) : (
              <span className="btn-primary w-full sm:w-auto text-center opacity-60 cursor-not-allowed">Chamar no WhatsApp</span>
            )}

            {schedulingHref ? (
              <Link href={schedulingHref} className="btn-secondary w-full sm:w-auto text-center">
                Agendar manutenção
              </Link>
            ) : (
              <span className="btn-secondary w-full sm:w-auto text-center opacity-60 cursor-not-allowed">Agendar manutenção</span>
            )}

            <button type="button" onClick={() => scrollToId('faq')} className="btn-secondary w-full sm:w-auto text-center">
              Ver dúvidas frequentes
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
