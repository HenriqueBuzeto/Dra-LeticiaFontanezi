import { IsString, IsOptional, MaxLength } from 'class-validator'

export class CreateReminderDto {
  @IsString()
  userId: string

  @IsString()
  tipo: string // push | email | whatsapp

  @IsString()
  dataEnvio: string // ISO date

  @IsOptional()
  @IsString()
  @MaxLength(200)
  titulo?: string

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  mensagem?: string
}
