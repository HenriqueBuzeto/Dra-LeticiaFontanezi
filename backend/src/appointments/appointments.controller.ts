import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { AdminGuard } from '../auth/admin.guard'
import { CurrentUser } from '../auth/current-user.decorator'
import { AppointmentsService } from './appointments.service'
import { CreateAppointmentDto } from './dto/create-appointment.dto'
import { CreateAppointmentAdminDto } from './dto/create-appointment-admin.dto'
import { UpdateAppointmentDto } from './dto/update-appointment.dto'
import { CheckinDto } from './dto/checkin.dto'

@Controller('appointments')
export class AppointmentsController {
  constructor(private service: AppointmentsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async list(@CurrentUser() user: { id: string }) {
    return this.service.findByUser(user.id)
  }

  @Get('all')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async listAll(@Query('date') date?: string) {
    return this.service.findAll(date)
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@CurrentUser() user: { id: string }, @Body() dto: CreateAppointmentDto) {
    return this.service.create(user.id, {
      data: dto.data,
      horario: dto.horario,
      tipo: dto.tipo,
      observacoes: dto.observacoes,
    })
  }

  @Post('for-user')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async createForUser(@Body() dto: CreateAppointmentAdminDto) {
    return this.service.create(dto.userId, {
      data: dto.data,
      horario: dto.horario,
      tipo: dto.tipo,
      observacoes: dto.observacoes,
    })
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async update(@Param('id') id: string, @Body() dto: UpdateAppointmentDto) {
    return this.service.update(id, dto)
  }

  @Post(':id/checkin')
  @UseGuards(JwtAuthGuard)
  async checkin(@Param('id') id: string, @CurrentUser() user: { id: string }, @Body() dto: CheckinDto) {
    return this.service.checkin(id, user.id, dto.status)
  }
}
