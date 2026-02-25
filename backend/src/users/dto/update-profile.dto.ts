import { IsString, IsOptional, IsEmail, IsIn, MaxLength } from 'class-validator'

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  nome?: string

  @IsOptional()
  @IsEmail()
  email?: string

  @IsOptional()
  @IsString()
  @MaxLength(30)
  telefone?: string

  @IsOptional()
  @IsString()
  @MaxLength(30)
  telefoneAlternativo?: string

  @IsOptional()
  @IsString()
  dataNascimento?: string

  @IsOptional()
  @IsString()
  @IsIn(['nao_informar', 'feminino', 'masculino', 'outro'])
  genero?: string

  @IsOptional()
  @IsString()
  avatar?: string

  @IsOptional()
  endereco?: Record<string, unknown>

  @IsOptional()
  contatoEmergencia?: Record<string, unknown>

  @IsOptional()
  @IsString()
  @IsIn(['push', 'email', 'whatsapp'])
  preferenciaLembrete?: string
}
