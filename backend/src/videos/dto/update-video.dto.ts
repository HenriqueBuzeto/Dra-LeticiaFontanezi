import { IsString, IsOptional, IsInt, Min, MaxLength } from 'class-validator'

export class UpdateVideoDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  titulo?: string

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  descricao?: string

  @IsOptional()
  @IsString()
  @MaxLength(500)
  url?: string

  @IsOptional()
  @IsString()
  @MaxLength(500)
  thumbnail?: string

  @IsOptional()
  @IsString()
  @MaxLength(50)
  categoria?: string

  @IsOptional()
  @IsInt()
  @Min(0)
  duracao?: number
}
