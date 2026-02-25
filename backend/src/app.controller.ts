import { Controller, Get } from '@nestjs/common'

@Controller()
export class AppController {
  @Get()
  root() {
    return {
      message: 'API Odontológico - Dra. Letícia Fontanezi',
      version: '1.0',
      endpoints: {
        health: 'GET /api/health',
        auth: {
          login: 'POST /api/auth/login',
          register: 'POST /api/auth/register',
          refresh: 'POST /api/auth/refresh',
        },
        users: { me: 'GET /api/users/me', updateMe: 'PATCH /api/users/me' },
        appointments: { list: 'GET /api/appointments', create: 'POST /api/appointments' },
        reminders: 'GET /api/reminders',
        videos: 'GET /api/videos',
        arSession: { list: 'GET /api/ar-session', create: 'POST /api/ar-session' },
      },
    }
  }
}
