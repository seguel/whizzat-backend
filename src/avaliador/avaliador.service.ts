import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
//import { Prisma, usuario_perfil_avaliador } from '@prisma/client';

@Injectable()
export class AvaliadorService {
  constructor(private readonly prisma: PrismaService) {}

  async getCheckHasPerfil(
    usuarioId: number,
    perfilId: number,
  ): Promise<{ avaliadorPerfil: any[] }> {
    const avaliadorPerfil = await this.prisma.usuario_perfil_avaliador.findMany(
      {
        where: {
          usuario_id: usuarioId,
          perfil_id: perfilId,
        },
      },
    );

    return {
      avaliadorPerfil, // se não houver nada, retorna []
    };
  }
}
