import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { AdminGuard } from '../auth/admin.guard'
import { RewardsService } from './rewards.service'
import { CreateRewardDto } from './dto/create-reward.dto'
import { UpdateRewardDto } from './dto/update-reward.dto'

@Controller('rewards')
export class RewardsController {
  constructor(private service: RewardsService) {}

  @Get()
  async list() {
    const rows = await this.service.findAll()
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      pointsRequired: r.pointsRequired,
      type: r.type,
      description: r.description,
    }))
  }

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  async create(@Body() dto: CreateRewardDto) {
    return this.service.create({
      name: dto.name,
      pointsRequired: dto.pointsRequired,
      type: dto.type,
      description: dto.description,
    })
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async update(@Param('id') id: string, @Body() dto: UpdateRewardDto) {
    return this.service.update(id, dto)
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async remove(@Param('id') id: string) {
    return this.service.remove(id)
  }
}
