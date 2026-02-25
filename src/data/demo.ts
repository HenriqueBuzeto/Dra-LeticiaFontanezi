export const HERO_SLIDES = [
  {
    id: '1',
    image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800&q=80',
    title: 'Cuidando do seu sorriso',
    subtitle: 'Tecnologia e humanização na sua saúde bucal',
  },
  {
    id: '2',
    image: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=800&q=80',
    title: 'Higiene em primeiro lugar',
    subtitle: 'Dicas e acompanhamento personalizado',
  },
  {
    id: '3',
    image: '/banner1.png',
    title: 'Dra. Letícia Fontanezi',
    subtitle: 'Ortodontia e odontologia premium',
  },
]

export const IMAGES = {
  dentalChair:
    'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=600&q=80',
  clinicHero:
    'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800&q=90',
  doctorProfile:
    'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&q=80',
  videoBrush:
    'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=400&q=80',
  videoFloss:
    'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=400&q=80',
  videoBraces:
    'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=400&q=80',
  videoFirstVisit:
    'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=400&q=80',
  whiteningSmile:
    'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&q=85',
}

export const CARE_APARELHO = {
  title: 'Cuidados com o aparelho',
  subtitle:
    'Seguir essas orientações ajuda a manter seu tratamento em dia, evita desconfortos e protege sua saúde bucal. Em caso de dúvida, converse com a Dra. Letícia.',
  heroImage: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=900&q=85',
  items: [
    {
      id: 'alimentacao',
      title: 'Alimentação',
      image: '/alimentação.jpg',
      description: 'Evite alimentos que possam soltar peças ou machucar a boca.',
      tips: [
        'Evite alimentos muito duros: pipoca, amendoim, torresmo, gelo, balas duras.',
        'Corte maçãs, cenouras e pães duros em pedaços pequenos.',
        'Evite morder canetas, unhas ou objetos.',
        'Prefira alimentos mais macios nos primeiros dias após ajustes.',
      ],
      iconLabel: 'Alimentação',
    },
    {
      id: 'higiene',
      title: 'Higiene diária',
      image: '/higienediaria.png',
      description: 'Limpe o aparelho e os dentes com frequência para evitar acúmulo de placa e cáries.',
      tips: [
        'Escove os dentes pelo menos três vezes ao dia, principalmente após as refeições.',
        'Use escova com cerdas macias e passe por cima e por baixo dos fios.',
        'Use fio dental com passa-fio ou escovas interdentais para limpar entre os brackets.',
        'Enxágue com antisséptico bucal quando indicado pela dentista.',
      ],
      iconLabel: 'Higiene',
    },
    {
      id: 'gengivas',
      title: 'Cuidados com as gengivas',
      image: '/gengivas.jpg',
      description: 'Uma boa higiene evita gengivas inchadas, vermelhas ou que sangram.',
      tips: [
        'Limpe a região entre o aparelho e a gengiva com suavidade.',
        'Gengivas inchadas ou que sangram podem indicar acúmulo de placa — intensifique a escovação.',
        'Massageie levemente a gengiva ao escovar, sem força excessiva.',
        'Em caso de sangramento persistente ou dor, entre em contato com a clínica.',
      ],
      iconLabel: 'Gengivas',
    },
    {
      id: 'gerais',
      title: 'Outros cuidados',
      image: '/outroscuidados.png',
      description: 'Pequenos hábitos fazem toda a diferença no conforto e no resultado do tratamento.',
      tips: [
        'Use cera ortodôntica nos brackets que estiverem machucando a bochecha ou os lábios.',
        'Não falte às consultas de manutenção; os ajustes são essenciais para o resultado.',
        'Em caso de peça solta ou fio quebrado, evite mexer e agende o quanto antes.',
        'Proteja o aparelho em esportes de contato com protetor bucal, se recomendado.',
      ],
      iconLabel: 'Dicas',
    },
  ],
}

export const DEMO_APPOINTMENT = {
  id: '1',
  tipo: 'Limpeza de rotina',
  data: '2025-02-15',
  horario: '10:00 - 11:30',
  status: 'confirmado' as const,
  diasRestantes: 4,
}

export const DEMO_VIDEOS = [
  {
    id: '1',
    titulo: 'A forma correta de escovar os dentes',
    duracao: 3,
    categoria: 'Higiene',
    thumbnail: IMAGES.videoBrush,
    url: '#',
  },
  {
    id: '2',
    titulo: 'Top 5 dicas de uso do fio dental',
    duracao: 5,
    categoria: 'Prevenção',
    thumbnail: IMAGES.videoFloss,
    url: '#',
  },
  {
    id: '3',
    titulo: 'Como limpar seu aparelho',
    duracao: 4,
    categoria: 'Guia de higiene',
    thumbnail: IMAGES.videoBraces,
    url: '#',
  },
  {
    id: '4',
    titulo: 'O que esperar na primeira consulta',
    duracao: 6,
    categoria: 'Primeira visita',
    thumbnail: IMAGES.videoFirstVisit,
    url: '#',
  },
]

const env: Record<string, string | undefined> = typeof process !== 'undefined' ? process.env : {}

export const DOCTOR_PROFILE = {
  nome: 'Dra. Letícia Fontanezi',
  titulo: 'Especialista em Ortodontia',
  foto: '',
  heroImage: IMAGES.clinicHero,
  avaliacao: 4.9,
  totalAvaliacoes: 120,
  bio: 'Formada em Odontologia pela UNIFEB em 2017. Especialista em Ortodontia pela Ortopós Barretos.',
  whatsapp: (env.NEXT_PUBLIC_DOCTOR_WHATSAPP as string) ?? '5517992279190',
  telefone: (env.NEXT_PUBLIC_DOCTOR_PHONE as string) || '',
  endereco: (env.NEXT_PUBLIC_DOCTOR_ADDRESS as string) ?? 'Ribeirão Preto',
  instagram: 'https://www.instagram.com/leticia.fontanezi/',
  especialidades: [],
}

export const DEMO_REMINDER_TIP = {
  mensagem: 'Não esqueça de escovar os dentes após as refeições e usar fio dental antes de dormir.',
  data: 'Dica da Dra.',
}

export const DEMO_REMINDERS = [
  { id: '1', titulo: 'Próxima consulta', data: '15 out', horario: '10:00', emBreve: true, feito: false, icon: 'calendar' as const },
  { id: '2', titulo: 'Escovar os dentes', data: '2h atrás', feito: true, icon: 'brush' as const },
  { id: '3', titulo: 'Renovar receita', data: 'Em 3 dias', feito: false, icon: 'pill' as const },
]

export const DEMO_CALENDAR_DAYS = Array.from({ length: 31 }, (_, i) => ({
  day: i + 1,
  weekday: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][(i + 5) % 7],
  isToday: i + 1 === 11,
  hasEvent: [11, 15, 22].includes(i + 1),
}))
