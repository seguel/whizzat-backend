import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class GraduacaoService {
  constructor(private readonly prisma: PrismaService) {}

  async getGraduacoes() {
    return this.prisma.graduacao.findMany({
      where: { ativo: true },
      orderBy: {
        graduacao: 'asc', // ou 'desc'
      },
    });
  }

  async getGraduacao(id: number) {
    return this.prisma.graduacao.findUnique({
      where: { id: id },
    });
  }
}
