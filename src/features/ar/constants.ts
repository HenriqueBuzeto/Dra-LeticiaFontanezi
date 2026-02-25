/**
 * Cores das borrachinhas (ligaduras) — organizadas por categoria com nome no site.
 * Nome exibido para o cliente; HEX para aplicação.
 */

export interface ElasticColorOption {
  name: string
  hex: string
}

export const ELASTIC_COLOR_CATEGORIES: { label: string; colors: ElasticColorOption[] }[] = [
  {
    label: 'Azuis',
    colors: [
      { name: 'Azul Claro', hex: '#6EC6FF' },
      { name: 'Azul Céu', hex: '#42A5F5' },
      { name: 'Azul Royal', hex: '#1565C0' },
      { name: 'Azul Marinho', hex: '#0D47A1' },
      { name: 'Azul Água', hex: '#00BCD4' },
    ],
  },
  {
    label: 'Verdes',
    colors: [
      { name: 'Verde Neon', hex: '#AEEA00' },
      { name: 'Verde Menta', hex: '#66BB6A' },
      { name: 'Verde Brasil', hex: '#2E7D32' },
      { name: 'Verde Floresta', hex: '#1B5E20' },
      { name: 'Verde Água', hex: '#26C6DA' },
    ],
  },
  {
    label: 'Roxos',
    colors: [
      { name: 'Lilás', hex: '#CE93D8' },
      { name: 'Roxo Claro', hex: '#AB47BC' },
      { name: 'Roxo Vibrante', hex: '#8E24AA' },
      { name: 'Violeta', hex: '#6A1B9A' },
    ],
  },
  {
    label: 'Vermelhos e Rosas',
    colors: [
      { name: 'Vermelho Clássico', hex: '#E53935' },
      { name: 'Bordô', hex: '#B71C1C' },
      { name: 'Pink', hex: '#FF1493' },
      { name: 'Rosa Bebê', hex: '#F48FB1' },
    ],
  },
  {
    label: 'Amarelos',
    colors: [
      { name: 'Amarelo Ouro', hex: '#FFD600' },
      { name: 'Amarelo Neon', hex: '#FFEA00' },
      { name: 'Amarelo Pastel', hex: '#FFF176' },
    ],
  },
  {
    label: 'Laranjas',
    colors: [
      { name: 'Laranja Vibrante', hex: '#FB8C00' },
      { name: 'Laranja Neon', hex: '#FF6D00' },
      { name: 'Pêssego', hex: '#FFB74D' },
    ],
  },
  {
    label: 'Neutras',
    colors: [
      { name: 'Transparente', hex: '#F5F5F5' },
      { name: 'Branco', hex: '#FFFFFF' },
      { name: 'Prata', hex: '#B0BEC5' },
      { name: 'Cinza', hex: '#9E9E9E' },
      { name: 'Preto', hex: '#000000' },
    ],
  },
]

/** Lista plana de todos os hex (para compatibilidade e download). */
export const ELASTIC_COLORS: string[] = ELASTIC_COLOR_CATEGORIES.flatMap((cat) =>
  cat.colors.map((c) => c.hex)
)

/** Cor inicial do seletor (Transparente). */
export const DEFAULT_ELASTIC_COLOR = '#F5F5F5'
