import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CertificacoesService {
  constructor(private readonly prisma: PrismaService) {}

  async getCertificados() {
    return this.prisma.certificacoes.findMany({
      where: { ativo: true },
      orderBy: {
        certificado: 'asc', // ou 'desc'
      },
    });
  }

  async getCertificado(id: number) {
    return this.prisma.certificacoes.findUnique({
      where: { id: id },
    });
  }

  async getCertificadosByName(nome: string) {
    return this.prisma.certificacoes.findFirst({
      where: {
        certificado: nome.trim(),
        ativo: true,
      },
    });
  }

  async createCertificado(data: { nome: string }) {
    return this.prisma.certificacoes.create({
      data: {
        certificado: data.nome.trim(),
        ativo: true,
      },
    });
  }

  async createOrGetCertificado(nome: string): Promise<{ id: number }> {
    // 🔒 validação: evita criar com valor vazio/undefined
    if (!nome || nome.trim() === '') {
      throw new BadRequestException('Nome do certificado é obrigatório.');
    }

    const existente = await this.prisma.certificacoes.findFirst({
      where: { certificado: nome },
      select: { id: true },
    });

    if (existente) {
      return { id: existente.id };
    }

    const novo = await this.prisma.certificacoes.create({
      data: { certificado: nome },
      select: { id: true },
    });

    return { id: novo.id };
  }
}
