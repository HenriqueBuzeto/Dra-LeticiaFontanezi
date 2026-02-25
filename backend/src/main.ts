import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { AppModule } from './app.module'
import { join } from 'path'
import { mkdirSync, existsSync } from 'fs'
import { NestExpressApplication } from '@nestjs/platform-express'

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
  const uploadsPath = join(process.cwd(), 'uploads')
  for (const sub of ['videos', 'thumbnails']) {
    const dir = join(uploadsPath, sub)
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  }
  app.useStaticAssets(uploadsPath, { prefix: '/api/uploads/' })
  app.setGlobalPrefix('api')
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  )
  const port = process.env.PORT || 4000
  await app.listen(port)
  console.log(`Backend running on http://localhost:${port}/api`)
}
bootstrap()
