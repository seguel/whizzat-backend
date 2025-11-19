import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { modalidade_trabalho } from '@prisma/client';

@Injectable()
export class ModalidadeService {
  constructor(private readonly prisma: PrismaService) {}

  async getModalidades(language: string): Promise<modalidade_trabalho[]> {
    return this.prisma.modalidade_trabalho.findMany({
      where: { ativo: true, linguagem: language },
      orderBy: {
        modalidade: 'asc', // ou 'desc'
      },
    });
  }

  async getModalidade(id: number): Promise<modalidade_trabalho | null> {
    return this.prisma.modalidade_trabalho.findUnique({
      where: { modalidade_trabalho_id: id },
    });
  }
}
