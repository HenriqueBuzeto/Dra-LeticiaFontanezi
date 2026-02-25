import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { CurrentUser } from '../auth/current-user.decorator'
import { ArSessionService } from './ar-session.service'

@Controller('ar-session')
@UseGuards(JwtAuthGuard)
export class ArSessionController {
  constructor(private service: ArSessionService) {}

  @Get()
  async list(@CurrentUser() user: { id: string }) {
    return this.service.findByUser(user.id)
  }

  @Post()
  async create(
    @CurrentUser() user: { id: string },
    @Body() body: { corElastico?: string; imagemUrl?: string },
  ) {
    return this.service.create(user.id, body)
  }
}
