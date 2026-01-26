import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Skill } from '@prisma/client';

@Injectable()
export class SkillService {
  constructor(private readonly prisma: PrismaService) {}

  async getSkills(language: string): Promise<Skill[]> {
    return await this.prisma.skill.findMany({
      where: { ativo: true, linguagem: language },
      orderBy: {
        skill: 'asc', // ou 'desc'
      },
    });
  }

  async getSkillsFiltro(language: string): Promise<Skill[]> {
    return await this.prisma.skill.findMany({
      where: {
        ativo: true,
        linguagem: language,
        vagas: {
          some: {}, // Filtra apenas skills que possuem ao menos uma vaga associada
        },
      },
      orderBy: {
        skill: 'asc',
      },
    });
  }

  async getSkill(id: number): Promise<Skill | null> {
    return await this.prisma.skill.findUnique({
      where: { skill_id: id },
    });
  }

  // src/skill/skill.service.ts

  async getSkillByName(nome: string): Promise<Skill | null> {
    return await this.prisma.skill.findFirst({
      where: {
        skill: nome.trim(),
        ativo: true,
      },
    });
  }

  async createSkill(
    data: { nome: string },
    language: string,
    tipoSkill: number,
  ): Promise<Skill> {
    return await this.prisma.skill.create({
      data: {
        skill: data.nome.trim(),
        ativo: true,
        tipo_skill_id: tipoSkill ?? 1,
        linguagem: language,
      },
    });
  }

  async createOrGetSkill(
    nome: string,
    language: string,
    tipoSkill: number,
  ): Promise<Skill> {
    return await this.prisma.skill.upsert({
      where: { skill: nome.trim() },
      update: {}, // não atualiza nada se já existir
      create: {
        skill: nome.trim(),
        ativo: true,
        tipo_skill_id: tipoSkill ?? 1,
        linguagem: language,
      },
    });
  }
}
