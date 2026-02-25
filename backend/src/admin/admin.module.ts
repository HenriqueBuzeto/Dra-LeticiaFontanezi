import { Module } from '@nestjs/common'
import { AdminController } from './admin.controller'
import { UsersModule } from '../users/users.module'
import { AppointmentsModule } from '../appointments/appointments.module'
import { VideosModule } from '../videos/videos.module'
import { RewardsModule } from '../rewards/rewards.module'

@Module({
  imports: [UsersModule, AppointmentsModule, VideosModule, RewardsModule],
  controllers: [AdminController],
})
export class AdminModule {}
