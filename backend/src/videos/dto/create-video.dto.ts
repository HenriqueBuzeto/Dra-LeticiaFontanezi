import { IsString, IsOptional, IsInt, Min, MaxLength } from 'class-validator'

export class CreateVideoDto {
  @IsString()
  @MaxLength(200)
  titulo: string

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  descricao?: string

  @IsString()
  @MaxLength(500)
  url: string

  @IsOptional()
  @IsString()
  @MaxLength(500)
  thumbnail?: string

  @IsString()
  @MaxLength(50)
  categoria: string

  @IsOptional()
  @IsInt()
  @Min(0)
  duracao?: number
}
