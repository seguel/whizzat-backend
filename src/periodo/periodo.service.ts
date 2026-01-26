import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PeriodoService {
  constructor(private readonly prisma: PrismaService) {}

  async getPeriodos(language: string) {
    return await this.prisma.periodoTrabalho.findMany({
      where: { ativo: true, linguagem: language },
      orderBy: {
        periodo: 'asc', // ou 'desc'
      },
    });
  }

  async getPeriodo(id: number) {
    return await this.prisma.periodoTrabalho.findUnique({
      where: { periodo_trabalho_id: id },
    });
  }
}
