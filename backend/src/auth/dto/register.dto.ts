import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator'

export class RegisterDto {
  @IsString()
  @MinLength(2)
  nome: string

  @IsEmail()
  email: string

  @IsString()
  @MinLength(6)
  senha: string

  @IsOptional()
  @IsString()
  telefone?: string

  @IsOptional()
  @IsString()
  dataNascimento?: string
}
