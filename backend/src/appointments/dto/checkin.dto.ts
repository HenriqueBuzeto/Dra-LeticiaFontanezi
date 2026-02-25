import { IsIn } from 'class-validator'

export class CheckinDto {
  @IsIn(['vai_comparecer', 'nao_comparecer'])
  status: 'vai_comparecer' | 'nao_comparecer'
}
