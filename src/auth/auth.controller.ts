import {
  Controller,
  Post,
  Body,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
  UseGuards,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { PrismaService } from '../prisma/prisma.service';
//import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ResendActivationDto } from './dto/resend-activation.dto';
import { RequestPasswordResetDto } from './dto/RequestPasswordResetDto';
import { ResetPasswordDto } from './dto/ResetPasswordDto';
import { MailService } from '../mail/mail.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Response } from 'express';

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

    const existUser = await this.authService.existsUserCreate(email);
    if (existUser) throw new ConflictException('Email já cadastrado.');

    const user = await this.authService.register(body);
    return user;
  }

  @Post('login')
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { email, senha } = body;

    if (!email || !senha) {
      throw new BadRequestException('Email e senha são obrigatórios');
    }

    const userValidate = await this.authService.validateUser(email, senha);
    if (!userValidate) throw new UnauthorizedException('Credenciais inválidas');

    const loginResult = await this.authService.login(userValidate);
    res.cookie('token', loginResult.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none', // <- isso é crucial quando os domínios são diferentes
      path: '/',
      maxAge: 60 * 60 * 1000, //1h
    });

    return loginResult;
  }

  @Post('activate')
  async activateAccount(@Body('token') token: string) {
    if (!token) {
      throw new BadRequestException('Token inválido');
    }
    const user = await this.authService.activateUserByToken(token);
    return { message: 'Conta ativada com sucesso!', user };
  }

  @Post('resend-activation')
  async resendActivation(@Body() body: ResendActivationDto) {
    const { email } = body;
    const message = await this.authService.resendActivationLink(email);
    return { message };
  }

  @Post('request-password-reset')
  async requestReset(@Body() body: RequestPasswordResetDto) {
    const { email } = body;
    const msg = await this.authService.requestPasswordReset(email);
    return { message: msg };
  }

  @Post('reset-password')
  async resetPassword(
    @Body() body: ResetPasswordDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.resetPassword(body);

    // Limpa o cookie token após resetar a senha
    res.clearCookie('token');

    return result;
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('token');
    return { message: 'Logout realizado com sucesso' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('protected')
  test(@Res() res: Response) {
    return res.send('Rota protegida com sucesso');
  }
}
