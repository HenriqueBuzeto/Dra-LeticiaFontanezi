import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { AdminGuard } from '../auth/admin.guard'
import { CurrentUser } from '../auth/current-user.decorator'
import { RemindersService } from './reminders.service'
import { CreateReminderDto } from './dto/create-reminder.dto'

@Controller('reminders')
export class RemindersController {
  constructor(private service: RemindersService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async list(@CurrentUser() user: { id: string }) {
    return this.service.findByUser(user.id)
  }

  @Get('all')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async listAll() {
    return this.service.findAll()
  }

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  async create(@Body() dto: CreateReminderDto) {
    return this.service.create(dto.userId, {
      tipo: dto.tipo,
      dataEnvio: dto.dataEnvio,
      titulo: dto.titulo,
      mensagem: dto.mensagem,
    })
  }
}
