import { IsIn, IsOptional, IsString } from 'class-validator'

export const POINT_ACTIONS = [
  'escovacao',
  'fio_dental',
  'consulta_presente',
  'limpeza_bucal',
  'uso_enxaguante',
  'checkin_semanal',
] as const

export type PointActionType = (typeof POINT_ACTIONS)[number]

export class AddPointsDto {
  @IsIn(POINT_ACTIONS as unknown as string[])
  action!: PointActionType

  @IsOptional()
  @IsString()
  metadata?: string
}
