import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
//import { JwtTokenResponse } from './interfaces/jwt-token-response.interface';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(
    email: string,
    password: string,
  ): Promise<LoginDto | null> {
    const user = await this.prisma.usuario.findFirst({
      where: { email, ativo: true },
    });

    if (!user) return null;

    const isMatch = await bcrypt.compare(password, user.senha);
    if (!isMatch) throw new UnauthorizedException('Credenciais inválidas');

    //const {email, senha: _, ...userData } = user;
    const userData: LoginDto = { email, senha: password };
    return userData;
  }

  async login(data: LoginDto) {
    const { email, senha } = data;

    const user = await this.prisma.usuario.findFirst({
      where: {
        email,
        ativo: true,
      },
    });

    if (!user || !(await bcrypt.compare(senha, user.senha))) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const payload = { sub: user.id, email: user.email };
    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        nome: `${user.primeiro_nome} ${user.ultimo_nome}`,
      },
    };
  }
}
