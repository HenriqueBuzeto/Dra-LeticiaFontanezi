import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AuthModule } from './auth/auth.module'
import { UsersModule } from './users/users.module'
import { AppointmentsModule } from './appointments/appointments.module'
import { RemindersModule } from './reminders/reminders.module'
import { VideosModule } from './videos/videos.module'
import { ArSessionModule } from './ar-session/ar-session.module'
import { PointsModule } from './points/points.module'
import { RewardsModule } from './rewards/rewards.module'
import { AdminModule } from './admin/admin.module'
import { DatabaseModule } from './database/database.module'
import { HealthModule } from './health/health.module'
import { AppController } from './app.controller'

@Module({
  controllers: [AppController],
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    HealthModule,
    AuthModule,
    UsersModule,
    AppointmentsModule,
    RemindersModule,
    VideosModule,
    ArSessionModule,
    PointsModule,
    RewardsModule,
    AdminModule,
  ],
})
export class AppModule {}
