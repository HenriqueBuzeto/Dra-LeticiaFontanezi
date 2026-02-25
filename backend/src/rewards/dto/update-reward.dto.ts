import { IsString, IsOptional, IsInt, Min } from 'class-validator'

export class UpdateRewardDto {
  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsInt()
  @Min(1)
  pointsRequired?: number

  @IsOptional()
  @IsString()
  type?: string

  @IsOptional()
  @IsString()
  description?: string
}
