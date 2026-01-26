import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class GeneroService {
  constructor(private readonly prisma: PrismaService) {}

  async getGeneros(language: string) {
    return await this.prisma.genero.findMany({
      where: { ativo: true, linguagem: language },
      orderBy: {
        genero: 'asc', // ou 'desc'
      },
    });
  }

  async getGenero(id: number) {
    return await this.prisma.genero.findUnique({
      where: { id: id },
    });
  }
}
