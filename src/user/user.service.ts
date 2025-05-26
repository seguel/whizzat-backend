import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { usuario, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

interface JwtPayload {
  userId: number;
}

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async createUser(data: Prisma.usuarioCreateInput): Promise<usuario> {
    const hashedPassword = await bcrypt.hash(data.senha, 10);

    return this.prisma.usuario.create({
      data: {
        ...data,
        senha: hashedPassword,
        ativo: false,
      },
    });
  }

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

  async activateUserByToken(token: string): Promise<usuario> {
    try {
      const payload = jwt.verify(
        token,
        process.env.JWT_ACTIVATE_SECRET || 'activate_secret',
      ) as JwtPayload;

      return await this.prisma.usuario.update({
        where: { id: payload.userId },
        data: { ativo: true },
      });
    } catch {
      throw new BadRequestException('Token inválido ou expirado.');
    }
  }
  /* async deleteUser(id: number): Promise<usuario> {
    return this.prisma.usuario.delete({ where: { id } });
  } */
}
