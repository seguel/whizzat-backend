import {
  Body,
  Param,
  Controller,
  Get,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { SkillService } from './skill.service';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { skill } from '@prisma/client';

@Controller('Skills')
export class SkillController {
  constructor(private readonly skillService: SkillService) {}

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  getSkill(@Param('id', ParseIntPipe) id: number): Promise<skill | null> {
    return this.skillService.getSkill(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  getSkills(): Promise<skill[]> {
    return this.skillService.getSkills();
  }
}
