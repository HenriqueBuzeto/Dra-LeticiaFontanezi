import { Module } from '@nestjs/common'
import { ArSessionService } from './ar-session.service'
import { ArSessionController } from './ar-session.controller'

@Module({
  controllers: [ArSessionController],
  providers: [ArSessionService],
})
export class ArSessionModule {}
