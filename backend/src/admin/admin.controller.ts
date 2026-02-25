import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { AdminGuard } from '../auth/admin.guard'
import { UsersService } from '../users/users.service'
import { AppointmentsService } from '../appointments/appointments.service'
import { VideosService } from '../videos/videos.service'
import { RewardsService } from '../rewards/rewards.service'

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(
    private users: UsersService,
    private appointments: AppointmentsService,
    private videos: VideosService,
    private rewards: RewardsService,
  ) {}

  @Get('checkins')
  async checkins(@Query('limit') limit?: string) {
    const limitNum = limit ? Math.min(parseInt(limit, 10) || 30, 100) : 30
    return this.appointments.findRecentCheckins(limitNum)
  }

  @Get('stats')
  async stats() {
    const [users, appointments, videos, rewardItems] = await Promise.all([
      this.users.findAll(),
      this.appointments.findAll(),
      this.videos.findAll(),
      this.rewards.findAll(),
    ])
    const today = new Date().toISOString().slice(0, 10)
    const appointmentsToday = appointments.filter((a) => a.data === today)
    return {
      usersCount: users.length,
      appointmentsCount: appointments.length,
      appointmentsTodayCount: appointmentsToday.length,
      videosCount: videos.length,
      rewardsCount: rewardItems.length,
    }
  }
}
