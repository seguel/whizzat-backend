import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ModalidadeService {
  constructor(private readonly prisma: PrismaService) {}

  async getModalidades(language: string) {
    return await this.prisma.modalidadeTrabalho.findMany({
      where: { ativo: true, linguagem: language },
      orderBy: {
        modalidade: 'asc', // ou 'desc'
      },
    });
  }

  async getModalidade(id: number) {
    return await this.prisma.modalidadeTrabalho.findUnique({
      where: { modalidade_trabalho_id: id },
    });
  }
}
