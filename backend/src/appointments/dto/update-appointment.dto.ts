import { IsString, IsOptional, MaxLength } from 'class-validator'

export class UpdateAppointmentDto {
  @IsOptional()
  @IsString()
  status?: string

  @IsOptional()
  @IsString()
  data?: string

  @IsOptional()
  @IsString()
  horario?: string

  @IsOptional()
  @IsString()
  @MaxLength(100)
  tipo?: string

  @IsOptional()
  @IsString()
  @MaxLength(500)
  observacoes?: string
}
