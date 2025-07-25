import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { usuario_perfil_empresa } from '@prisma/client';

@Injectable()
export class EmpresaService {
  constructor(private readonly prisma: PrismaService) {}

  async createEmpresa(data: {
    usuario_id: number;
    perfil_id: number;
    nome_empresa: string;
    website: string;
    email: string;
    telefone: string;
    localizacao: string;
    apresentacao: string;
    logo: string;
    imagem_fundo: string;
  }) {
    return this.prisma.usuario_perfil_empresa.create({
      data,
    });
  }

  async getEmpresas(
    usuarioId: number,
    perfiIid: number,
  ): Promise<usuario_perfil_empresa[]> {
    return this.prisma.usuario_perfil_empresa.findMany({
      where: { usuario_id: usuarioId, perfil_id: perfiIid },
    });
  }

  async getEmpresa(id: number): Promise<usuario_perfil_empresa | null> {
    return this.prisma.usuario_perfil_empresa.findUnique({
      where: { empresa_id: id },
    });
  }

  async hasPerfilInEmpresa(
    usuarioId: number,
    perfil: number,
  ): Promise<boolean> {
    const vinculo: usuario_perfil_empresa | null =
      await this.prisma.usuario_perfil_empresa.findFirst({
        where: {
          usuario_id: usuarioId,
          perfil_id: perfil,
        },
      });

    return !!vinculo;
  }
}
