import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CidadeService {
  constructor(private readonly prisma: PrismaService) {}

  async getCidades(estado_id: number) {
    return await this.prisma.estadoCidade.findMany({
      where: { estado_id: estado_id },
      orderBy: {
        cidade: 'asc', // ou 'desc'
      },
    });
  }

  async getCidade(id: number) {
    return await this.prisma.estadoCidade.findUnique({
      where: { id: id },
    });
  }
}
