import {
  Controller,
  Post,
  Body,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private prisma: PrismaService,
  ) {}

  @Post('register')
  async register(@Body() body: RegisterDto) {
    const { primeiro_nome, ultimo_nome, email, senha } = body;

    if (!primeiro_nome || !ultimo_nome || !email || !senha) {
      throw new BadRequestException('Todos os campos são obrigatórios');
    }

    const user = await this.authService.validateUser(email, senha);
    if (user) throw new ConflictException('Email já cadastrado.');

    const hashedPassword = await bcrypt.hash(senha, 10);
    const newUser = await this.prisma.usuario.create({
      data: {
        email,
        senha: hashedPassword,
        primeiro_nome,
        ultimo_nome,
        ativo: false,
      },
    });

    return {
      id: newUser.id,
      email: newUser.email,
      primeiro_nome: newUser.primeiro_nome,
      ultimo_nome: newUser.ultimo_nome,
    };
  }

  @Post('login')
  async login(@Body() body: LoginDto) {
    const { email, senha } = body;

    if (!email || !senha) {
      throw new BadRequestException('Email e senha são obrigatórios');
    }

    const user = await this.authService.validateUser(email, senha);
    if (!user) throw new UnauthorizedException('Credenciais inválidas');

    return this.authService.login(user);
  }
}
