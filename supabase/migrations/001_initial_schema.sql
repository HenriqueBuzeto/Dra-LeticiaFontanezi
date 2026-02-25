-- =============================================================================
-- Projeto: Site Dra. Letícia Fontanezi – Schema Supabase (PostgreSQL)
-- Projeto Supabase: hnzwsloigkqfnyibkngy
-- Execute este arquivo no SQL Editor do Supabase (Dashboard → SQL Editor → New query).
-- =============================================================================

-- Extensões úteis (Supabase já tem uuid; habilitar se precisar)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. Tabela: user (usuários do app – login/perfil)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "user" (
  id                TEXT PRIMARY KEY,
  nome              TEXT NOT NULL,
  email             TEXT NOT NULL UNIQUE,
  telefone          TEXT,
  telefone_alternativo TEXT,
  data_nascimento    DATE,
  genero            TEXT CHECK (genero IN ('nao_informar', 'feminino', 'masculino', 'outro')),
  senha_hash        TEXT NOT NULL,
  role              TEXT NOT NULL DEFAULT 'paciente' CHECK (role IN ('admin', 'paciente')),
  avatar            TEXT,
  endereco          JSONB,
  contato_emergencia JSONB,
  preferencia_lembrete TEXT CHECK (preferencia_lembrete IN ('push', 'email', 'whatsapp')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE "user" IS 'Usuários do sistema (pacientes e admin)';

-- -----------------------------------------------------------------------------
-- 2. Tabela: appointment (consultas agendadas)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS appointment (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  data          TEXT NOT NULL,
  horario       TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('confirmado', 'pendente', 'cancelado')),
  tipo          TEXT DEFAULT 'Consulta',
  observacoes   TEXT,
  checkin_status TEXT CHECK (checkin_status IN ('vai_comparecer', 'nao_comparecer')),
  checkin_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appointment_user ON appointment(user_id);
CREATE INDEX IF NOT EXISTS idx_appointment_data ON appointment(data);
COMMENT ON TABLE appointment IS 'Consultas agendadas por paciente';

-- -----------------------------------------------------------------------------
-- 3. Tabela: reminder (lembretes / notificações enviadas)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reminder (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  tipo       TEXT NOT NULL CHECK (tipo IN ('push', 'email', 'whatsapp')),
  data_envio TIMESTAMPTZ NOT NULL,
  status     TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('enviado', 'pendente', 'falhou')),
  titulo     TEXT,
  mensagem   TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reminder_user ON reminder(user_id);
COMMENT ON TABLE reminder IS 'Registro de lembretes/notificações enviadas';

-- -----------------------------------------------------------------------------
-- 4. Tabela: video (vídeos do site)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS video (
  id         TEXT PRIMARY KEY,
  titulo     TEXT NOT NULL,
  descricao  TEXT,
  url        TEXT NOT NULL,
  thumbnail  TEXT,
  categoria  TEXT NOT NULL CHECK (categoria IN ('higiene', 'primeira_consulta', 'cuidados_aparelho', 'outros')),
  duracao    INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE video IS 'Vídeos educativos / dicas';

-- -----------------------------------------------------------------------------
-- 5. Tabela: ar_session (sessões do simulador AR)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ar_session (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  cor_elastico  TEXT,
  imagem_url    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ar_session_user ON ar_session(user_id);
COMMENT ON TABLE ar_session IS 'Sessões do simulador de cores (borrachinhas)';

-- -----------------------------------------------------------------------------
-- 6. Tabela: point_log (gamificação – pontos)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS point_log (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  action     TEXT NOT NULL CHECK (action IN (
    'escovacao', 'fio_dental', 'consulta_presente', 'limpeza_bucal', 'uso_enxaguante', 'checkin_semanal'
  )),
  points     INTEGER NOT NULL,
  metadata   TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_point_log_user ON point_log(user_id);
CREATE INDEX IF NOT EXISTS idx_point_log_created ON point_log(created_at DESC);
COMMENT ON TABLE point_log IS 'Log de ações que geram pontos (gamificação)';

-- -----------------------------------------------------------------------------
-- 7. Tabela: doctor_info (dados da doutora – uma linha)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS doctor_info (
  id                TEXT PRIMARY KEY DEFAULT 'default',
  nome              TEXT NOT NULL,
  especializacao    TEXT NOT NULL,
  bio               TEXT,
  foto              TEXT,
  avaliacao         NUMERIC(3,2) DEFAULT 5,
  total_avaliacoes  INTEGER DEFAULT 0,
  whatsapp          TEXT,
  telefone          TEXT,
  endereco          TEXT,
  lat               NUMERIC(10,7),
  lng               NUMERIC(10,7),
  especialidades    JSONB DEFAULT '[]'::jsonb,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE doctor_info IS 'Dados da Dra. Letícia (uma única linha)';

-- -----------------------------------------------------------------------------
-- 8. Tabela: reward_item (brindes / resgates por pontos)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reward_item (
  id               TEXT PRIMARY KEY,
  name             TEXT NOT NULL,
  points_required  INTEGER NOT NULL,
  type             TEXT NOT NULL CHECK (type IN ('escova', 'kit', 'consulta', 'brinde')),
  description      TEXT NOT NULL
);

COMMENT ON TABLE reward_item IS 'Itens de resgate por pontos (gamificação)';

-- -----------------------------------------------------------------------------
-- Trigger: updated_at automático
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers por tabela (updated_at automático)
DROP TRIGGER IF EXISTS tr_user_updated_at ON "user";
CREATE TRIGGER tr_user_updated_at BEFORE UPDATE ON "user" FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
DROP TRIGGER IF EXISTS tr_appointment_updated_at ON appointment;
CREATE TRIGGER tr_appointment_updated_at BEFORE UPDATE ON appointment FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
DROP TRIGGER IF EXISTS tr_video_updated_at ON video;
CREATE TRIGGER tr_video_updated_at BEFORE UPDATE ON video FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
DROP TRIGGER IF EXISTS tr_doctor_info_updated_at ON doctor_info;
CREATE TRIGGER tr_doctor_info_updated_at BEFORE UPDATE ON doctor_info FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- -----------------------------------------------------------------------------
-- Seed: vídeos iniciais (só insere se vazia)
-- -----------------------------------------------------------------------------
INSERT INTO video (id, titulo, descricao, url, thumbnail, categoria, duracao, created_at, updated_at)
VALUES
  ('v1', 'A forma correta de escovar os dentes', 'Dicas de escovação', 'https://www.youtube.com/watch?v=example1', 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=400&q=80', 'higiene', 3, NOW(), NOW()),
  ('v2', 'Top 5 dicas de uso do fio dental', 'Uso do fio dental', 'https://www.youtube.com/watch?v=example2', 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=400&q=80', 'outros', 5, NOW(), NOW()),
  ('v3', 'Como limpar seu aparelho', 'Higiene com aparelho', 'https://www.youtube.com/watch?v=example3', 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=400&q=80', 'cuidados_aparelho', 4, NOW(), NOW()),
  ('v4', 'O que esperar na primeira consulta', 'Primeira visita', 'https://www.youtube.com/watch?v=example4', 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=400&q=80', 'primeira_consulta', 6, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- Seed: reward_item (brindes)
-- -----------------------------------------------------------------------------
INSERT INTO reward_item (id, name, points_required, type, description)
VALUES
  ('r1', 'Escova dental premium', 50, 'escova', 'Troque 50 pontos'),
  ('r2', 'Kit higiene bucal', 100, 'kit', 'Escova + fio + creme'),
  ('r3', 'Desconto em consulta', 200, 'consulta', 'R$ 30 de desconto'),
  ('r4', 'Brinde surpresa', 150, 'brinde', 'Item exclusivo')
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- Seed: doctor_info (uma linha – opcional)
-- -----------------------------------------------------------------------------
INSERT INTO doctor_info (id, nome, especializacao, bio, avaliacao, total_avaliacoes, whatsapp, telefone, endereco, especialidades)
VALUES (
  'default',
  'Dra. Letícia Fontanezi',
  'Ortodontia',
  'Especialista em ortodontia e cuidados com aparelho.',
  5.0,
  0,
  '',
  '',
  '',
  '["Ortodontia","Aparelho fixo","Alinhadores"]'::jsonb
)
ON CONFLICT (id) DO NOTHING;
