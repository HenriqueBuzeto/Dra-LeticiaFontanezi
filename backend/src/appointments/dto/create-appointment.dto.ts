import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator'

export class CreateAppointmentDto {
  @IsString()
  @MinLength(1)
  data: string

  @IsString()
  @MinLength(1)
  horario: string

  @IsOptional()
  @IsString()
  @MaxLength(100)
  tipo?: string

  @IsOptional()
  @IsString()
  @MaxLength(500)
  observacoes?: string
}
