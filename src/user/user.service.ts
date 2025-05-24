import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { usuario, Prisma } from '@prisma/client';
//import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  /* async createUser(data: Prisma.usuarioCreateInput): Promise<usuario> {
    const hashedPassword = await bcrypt.hash(data.senha, 10);
    return this.prisma.usuario.create({
      data: {
        ...data,
        senha: hashedPassword,
      },
    });
  } */

  async getUsers(): Promise<usuario[]> {
    return this.prisma.usuario.findMany();
  }

  async getUser(id: number): Promise<usuario | null> {
    return this.prisma.usuario.findUnique({ where: { id } });
  }

  async updateUser(
    id: number,
    data: Prisma.usuarioUpdateInput,
  ): Promise<usuario> {
    return this.prisma.usuario.update({ where: { id }, data });
  }

  /* async deleteUser(id: number): Promise<usuario> {
    return this.prisma.usuario.delete({ where: { id } });
  } */
}
