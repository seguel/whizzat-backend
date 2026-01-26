import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Usuario, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async createUser(data: Prisma.UsuarioCreateInput): Promise<Usuario> {
    const hashedPassword = await bcrypt.hash(data.senha, 10);

    return await this.prisma.usuario.create({
      data: {
        ...data,
        senha: hashedPassword,
        ativo: false,
      },
    });
  }

  async getUsers(): Promise<Usuario[]> {
    return await this.prisma.usuario.findMany();
  }

  async getUser(id: number): Promise<Usuario | null> {
    return await this.prisma.usuario.findUnique({ where: { id } });
  }

  async updateUser(
    id: number,
    data: Prisma.UsuarioUpdateInput,
  ): Promise<Usuario> {
    return await this.prisma.usuario.update({ where: { id }, data });
  }

  async updateUserPerfil(
    id: number,
    data: Prisma.UsuarioUpdateInput,
    email: string,
    primeiro_nome: string,
    lang: string,
  ): Promise<{ access_token: string; user: Usuario }> {
    const updatedUser = await this.prisma.usuario.update({
      where: { id },
      data,
    });

    const payload = {
      sub: id,
      email,
      nome: primeiro_nome,
      perfil: data.id_perfil,
      lang: lang,
    };

    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
      user: updatedUser,
    };
  }

  /* async deleteUser(id: number): Promise<usuario> {
    return this.prisma.usuario.delete({ where: { id } });
  } */
}
