import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { skill } from '@prisma/client';

@Injectable()
export class SkillService {
  constructor(private readonly prisma: PrismaService) {}

  async getSkills(): Promise<skill[]> {
    return this.prisma.skill.findMany({
      where: { ativo: true },
      orderBy: {
        skill: 'asc', // ou 'desc'
      },
    });
  }

  async getSkill(id: number): Promise<skill | null> {
    return this.prisma.skill.findUnique({
      where: { skill_id: id },
    });
  }

  // src/skill/skill.service.ts

  async getSkillByName(nome: string): Promise<skill | null> {
    return this.prisma.skill.findFirst({
      where: {
        skill: nome.trim(),
        ativo: true,
      },
    });
  }

  async createSkill(data: { nome: string }): Promise<skill> {
    return this.prisma.skill.create({
      data: {
        skill: data.nome.trim(),
        ativo: true,
      },
    });
  }

  async createOrGetSkill(nome: string): Promise<skill> {
    return this.prisma.skill.upsert({
      where: { skill: nome.trim() },
      update: {}, // não atualiza nada se já existir
      create: {
        skill: nome.trim(),
        ativo: true,
      },
    });
  }
}
