import {
  Controller,
  Post,
  Body,
  Get,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
  UseGuards,
  Res,
  Headers,
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
import { I18nService } from 'nestjs-i18n'; /* , I18nLang */

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private readonly userService: UserService,
    private prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly i18n: I18nService,
  ) {}

  @Post('register')
  async register(
    @Body() body: RegisterDto,
    @Headers('accept-language') language: string,
  ) {
    const { primeiro_nome, ultimo_nome, email, senha } = body;

    if (!primeiro_nome || !ultimo_nome || !email || !senha) {
      const messageRetorno = this.i18n.translate(
        'common.auth.campo_obrigatorio',
        {
          lang: language,
        },
      );
      throw new BadRequestException(messageRetorno);
    }

    const existUser = await this.authService.existsUserCreate(email);
    if (existUser) {
      const messageRetorno = this.i18n.translate(
        'common.auth.email_cadastrado',
        {
          lang: language,
        },
      );
      throw new ConflictException(messageRetorno);
    }
    const user = await this.authService.register(body, language);
    return user;
  }

  @Post('login')
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) res: Response,
    @Headers('accept-language') language: string,
  ) {
    const { email, senha } = body;

    if (!email || !senha) {
      const messageRetorno = this.i18n.translate(
        'common.auth.campo_obrigatorio',
        {
          lang: language,
        },
      );

      throw new BadRequestException(messageRetorno);
    }

    const userValidate = await this.authService.validateUser(
      email,
      senha,
      language,
    );
    if (!userValidate) {
      const messageRetorno = this.i18n.translate(
        'common.auth.credencial_invalida',
        {
          lang: language,
        },
      );
      throw new UnauthorizedException(messageRetorno);
    }

    const loginResult = await this.authService.login(userValidate, language);
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
  async activateAccount(
    @Body('token') token: string,
    @Headers('accept-language') language: string,
  ) {
    if (!token) {
      const messageRetorno = this.i18n.translate('common.auth.token_invalido', {
        lang: language,
      });
      throw new BadRequestException(messageRetorno);
    }
    const user = await this.authService.activateUserByToken(token, language);
    const messageRetorno = this.i18n.translate(
      'common.auth.conta_ativada_sucesso',
      {
        lang: language,
      },
    );
    return { message: messageRetorno, user };
  }

  @Post('resend-activation')
  async resendActivation(
    @Body() body: ResendActivationDto,
    @Headers('accept-language') language: string,
  ) {
    const { email } = body;
    const message = await this.authService.resendActivationLink(
      email,
      language,
    );
    return { message };
  }

  @Post('request-password-reset')
  async requestReset(
    @Body() body: RequestPasswordResetDto,
    @Headers('accept-language') language: string,
  ) {
    const { email } = body;
    const msg = await this.authService.requestPasswordReset(email, language);
    return { message: msg };
  }

  @Post('reset-password')
  async resetPassword(
    @Body() body: ResetPasswordDto,
    @Res({ passthrough: true }) res: Response,
    @Headers('accept-language') language: string,
  ) {
    const result = await this.authService.resetPassword(body, language);

    // Limpa o cookie token após resetar a senha
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // se estiver em prod
      sameSite: 'none', // ou 'strict', dependendo do seu setup
      path: '/', // importante para garantir que o cookie seja limpo
    });

    return result;
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // se estiver em prod
      sameSite: 'none', // ou 'strict', dependendo do seu setup
      path: '/', // importante para garantir que o cookie seja limpo
    });
    return { message: 'Logout realizado com sucesso' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('check')
  check() {
    return { authenticated: true };
  }

  /* @Get('test-msg')
  getTestMsg(@I18nLang() lang: string) {
    return this.i18n.translate('validation.senha_tamanho', { lang });
  } */
}
