import {
  Controller,
  Post,
  Body,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { PrismaService } from '../prisma/prisma.service';
//import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { MailService } from '../mail/mail.service';
import { generateActivationToken } from '../lib/util';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private readonly userService: UserService,
    private prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  @Post('register')
  async register(@Body() body: RegisterDto) {
    const { primeiro_nome, ultimo_nome, email, senha } = body;

    if (!primeiro_nome || !ultimo_nome || !email || !senha) {
      throw new BadRequestException('Todos os campos são obrigatórios');
    }

    const user = await this.authService.existsUserCreate(email);
    if (user) throw new ConflictException('Email já cadastrado.');

    const newUser = await this.userService.createUser(body);

    const token = generateActivationToken(newUser.id);

    const activationLink = `http://localhost:3001/cadastro/confirmar-email?token=${token}`; //`https://meusite.com/confirmar-email?token=${token}`;

    await this.mailService.sendWelcomeEmail(
      newUser.email,
      `${newUser.primeiro_nome} ${newUser.ultimo_nome}`,
      activationLink,
    );

    return {
      id: newUser.id,
      email: newUser.email,
      primeiro_nome: newUser.primeiro_nome,
      ultimo_nome: newUser.ultimo_nome,
    };

    /* const hashedPassword = await bcrypt.hash(senha, 10);
    const newUser = await this.prisma.usuario.create({
      data: {
        email,
        senha: hashedPassword,
        primeiro_nome,
        ultimo_nome,
        ativo: false,
      },
    });

    // Enviar email após criar usuário
    await this.mailService.sendWelcomeEmail(
      email,
      `${primeiro_nome} ${ultimo_nome}`,
    ); 

    return {
      id: newUser.id,
      email: newUser.email,
      primeiro_nome: newUser.primeiro_nome,
      ultimo_nome: newUser.ultimo_nome,
    };*/
  }

  @Post('activate')
  async activateAccount(@Body('token') token: string) {
    const user = await this.userService.activateUserByToken(token);
    return { message: 'Conta ativada com sucesso!', user };
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
