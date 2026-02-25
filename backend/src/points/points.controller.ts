import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { CurrentUser } from '../auth/current-user.decorator'
import { PointsService } from './points.service'
import { AddPointsDto } from './dto/add-points.dto'

@Controller('points')
@UseGuards(JwtAuthGuard)
export class PointsController {
  constructor(private service: PointsService) {}

  @Get('summary')
  async summary(@CurrentUser() user: { id: string }) {
    return this.service.getSummary(user.id)
  }

  @Post('add')
  async add(@CurrentUser() user: { id: string }, @Body() dto: AddPointsDto) {
    return this.service.addPoints(user.id, dto.action, dto.metadata)
  }

  @Get('history')
  async history(@CurrentUser() user: { id: string }) {
    return this.service.getHistory(user.id)
  }
}
