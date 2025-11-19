import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { periodo_trabalho } from '@prisma/client';

@Injectable()
export class PeriodoService {
  constructor(private readonly prisma: PrismaService) {}

  async getPeriodos(language: string): Promise<periodo_trabalho[]> {
    return this.prisma.periodo_trabalho.findMany({
      where: { ativo: true, linguagem: language },
      orderBy: {
        periodo: 'asc', // ou 'desc'
      },
    });
  }

  async getPeriodo(id: number): Promise<periodo_trabalho | null> {
    return this.prisma.periodo_trabalho.findUnique({
      where: { periodo_trabalho_id: id },
    });
  }
}
