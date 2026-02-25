import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { diskStorage } from 'multer'
import { join, extname } from 'path'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { AdminGuard } from '../auth/admin.guard'
import { VideosService } from './videos.service'
import { CreateVideoDto } from './dto/create-video.dto'
import { UpdateVideoDto } from './dto/update-video.dto'

const UPLOADS_DIR = join(process.cwd(), 'uploads')

const videoStorage = diskStorage({
  destination: join(UPLOADS_DIR, 'videos'),
  filename: (_req, file, cb) => {
    const name = Date.now().toString(36) + extname(file.originalname).toLowerCase()
    cb(null, name)
  },
})

const thumbnailStorage = diskStorage({
  destination: join(UPLOADS_DIR, 'thumbnails'),
  filename: (_req, file, cb) => {
    const name = Date.now().toString(36) + (extname(file.originalname) || '.jpg').toLowerCase()
    cb(null, name)
  },
})

@Controller('videos')
export class VideosController {
  constructor(private service: VideosService) {}

  @Get()
  async list() {
    return this.service.findAll()
  }

  @Post('upload-video')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: videoStorage,
      limits: { fileSize: 300 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const allowed = /\.(mp4|webm|mov|avi|mkv)$/i.test(file.originalname) || file.mimetype?.startsWith('video/')
        if (allowed) cb(null, true)
        else cb(new BadRequestException('Apenas arquivos de vídeo (mp4, webm, mov, etc.)'), false)
      },
    }),
  )
  uploadVideo(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Nenhum arquivo enviado')
    return { url: `/api/uploads/videos/${file.filename}` }
  }

  @Post('upload-thumbnail')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: thumbnailStorage,
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const allowed = /\.(jpg|jpeg|png|gif|webp)$/i.test(file.originalname) || file.mimetype?.startsWith('image/')
        if (allowed) cb(null, true)
        else cb(new BadRequestException('Apenas imagens (jpg, png, gif, webp)'), false)
      },
    }),
  )
  uploadThumbnail(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Nenhum arquivo enviado')
    return { url: `/api/uploads/thumbnails/${file.filename}` }
  }

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  async create(@Body() dto: CreateVideoDto) {
    return this.service.create({
      titulo: dto.titulo,
      descricao: dto.descricao,
      url: dto.url,
      thumbnail: dto.thumbnail,
      categoria: dto.categoria,
      duracao: dto.duracao,
    })
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async update(@Param('id') id: string, @Body() dto: UpdateVideoDto) {
    return this.service.update(id, dto)
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async remove(@Param('id') id: string) {
    return this.service.remove(id)
  }
}
