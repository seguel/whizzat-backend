import {
  Body,
  Param,
  Controller,
  Get,
  ParseIntPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { SkillService } from './skill.service';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { skill } from '@prisma/client';

@Controller('Skills')
export class SkillController {
  constructor(private readonly skillService: SkillService) {}

  @UseGuards(JwtAuthGuard)
  @Get('filtro')
  getSkillsFiltro(
    @Req() req: Request & { user: JwtPayload },
  ): Promise<skill[]> {
    const lang = req.user?.lang ?? 'pt';
    return this.skillService.getSkillsFiltro(lang);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  getSkill(@Param('id', ParseIntPipe) id: number): Promise<skill | null> {
    return this.skillService.getSkill(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  getSkills(@Req() req: Request & { user: JwtPayload }): Promise<skill[]> {
    const lang = req.user?.lang ?? 'pt';
    return this.skillService.getSkills(lang);
  }
}
