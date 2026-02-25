import { IsString, IsInt, Min } from 'class-validator'

export class CreateRewardDto {
  @IsString()
  name: string

  @IsInt()
  @Min(1)
  pointsRequired: number

  @IsString()
  type: string // escova | kit | consulta | brinde

  @IsString()
  description: string
}
