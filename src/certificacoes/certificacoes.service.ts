import { Injectable } from '@nestjs/common';
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

  async createOrGetCertificado(nome: string) {
    return this.prisma.certificacoes.upsert({
      where: { certificado: nome.trim() },
      update: {}, // não atualiza nada se já existir
      create: {
        certificado: nome.trim(),
        ativo: true,
      },
    });
  }
}
