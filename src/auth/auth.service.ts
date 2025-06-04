import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/ResetPasswordDto';
import * as jwt from 'jsonwebtoken';
import { generateActivationToken, generateResetTokenCurto } from '../lib/util';
import { I18nService } from 'nestjs-i18n';

interface JwtPayload {
  userId: number;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly i18n: I18nService,
  ) {}

  async register(data: RegisterDto, language: string) {
    const { primeiro_nome, ultimo_nome, email, senha } = data;

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

    const token = generateActivationToken(newUser.id);

    const activationLink = `${process.env.SITE_URL}/cadastro/confirmar-email?token=${token}&email=${email}&lng=${language}`; //`https://meusite.com/confirmar-email?token=${token}`;

    await this.mailService.sendWelcomeEmail(
      newUser.email,
      `${newUser.primeiro_nome} ${newUser.ultimo_nome}`,
      activationLink,
      language,
    );

    return {
      id: newUser.id,
      email: newUser.email,
      primeiro_nome: newUser.primeiro_nome,
      ultimo_nome: newUser.ultimo_nome,
    };
  }

  async login(data: LoginDto, language: string) {
    const { email, senha } = data;

    const user = await this.prisma.usuario.findFirst({
      where: {
        email,
        ativo: true,
      },
    });

    if (!user || !(await bcrypt.compare(senha, user.senha))) {
      const messageRetorno = this.i18n.translate(
        'common.auth.credencial_invalida',
        {
          lang: language,
        },
      );

      throw new UnauthorizedException(messageRetorno);
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

  async requestPasswordReset(email: string, language: string): Promise<string> {
    const user = await this.prisma.usuario.findUnique({ where: { email } });
    const messageRetorno = this.i18n.translate('common.auth.se_existir_email', {
      lang: language,
    });

    if (!user) return messageRetorno;

    const token = generateResetTokenCurto(user.id);

    const Link = `${process.env.SITE_URL}/cadastro/redefinir-senha?token=${token}&email=${email}&lng=${language}`; //`https://meusite.com/confirmar-email?token=${token}`;

    await this.mailService.sendPasswordResetEmail(
      email,
      `${user.primeiro_nome} ${user.ultimo_nome}`,
      Link,
      language,
    );

    return messageRetorno;
  }

  async resetPassword(dto: ResetPasswordDto, language: string) {
    const { token, novaSenha } = dto;

    try {
      const payload = jwt.verify(token, process.env.JWT_RESET_SECRET!) as {
        userId: number;
      };

      const hashed = await bcrypt.hash(novaSenha, 10);
      await this.prisma.usuario.update({
        where: { id: payload.userId },
        data: { senha: hashed },
      });

      const messageRetorno = this.i18n.translate(
        'common.auth.senha_redefinida',
        {
          lang: language,
        },
      );

      return { message: messageRetorno };
    } catch {
      const messageRetorno = this.i18n.translate('common.auth.token_expirado', {
        lang: language,
      });
      throw new BadRequestException(messageRetorno);
    }
  }

  async existsUserCreate(email: string): Promise<boolean> {
    const user = await this.prisma.usuario.findFirst({
      where: { email },
    });

    if (user) return true;
    else return false;
  }

  async validateUser(
    email: string,
    password: string,
    language: string,
  ): Promise<LoginDto | null> {
    const user = await this.prisma.usuario.findFirst({
      where: { email },
    });

    if (!user) return null;

    const isMatch = await bcrypt.compare(password, user.senha);
    if (!isMatch) {
      const messageRetorno = this.i18n.translate(
        'common.auth.credencial_invalida',
        {
          lang: language,
        },
      );
      throw new UnauthorizedException(messageRetorno);
    }

    //const {email, senha: _, ...userData } = user;
    const userData: LoginDto = { email, senha: password };
    return userData;
  }

  async activateUserByToken(token: string, language: string) {
    try {
      const payload = jwt.verify(
        token,
        process.env.JWT_ACTIVATE_SECRET!,
      ) as JwtPayload;

      const user = await this.prisma.usuario.findUnique({
        where: { id: payload.userId },
      });

      if (!user) {
        const messageRetorno = this.i18n.translate(
          'common.auth.usuario_nao_encotrado',
          { lang: language },
        );
        throw new Error(messageRetorno);
      }

      if (user.ativo) return user;

      return await this.prisma.usuario.update({
        where: { id: user.id },
        data: { ativo: true },
      });
    } catch (err) {
      let messageRetorno = '';

      if (err instanceof jwt.TokenExpiredError) {
        messageRetorno = this.i18n.translate('common.auth.token_expirado', {
          lang: language,
        });
        throw new BadRequestException(messageRetorno);
      } else {
        messageRetorno = this.i18n.translate('common.auth.token_invalido', {
          lang: language,
        });
        throw new BadRequestException(messageRetorno);
      }
    }
  }
  async resendActivationLink(email: string, language: string): Promise<string> {
    const user = await this.prisma.usuario.findUnique({
      where: { email },
    });

    if (!user) {
      const messageRetorno = this.i18n.translate(
        'common.auth.usuario_nao_encotrado',
        {
          lang: language,
        },
      );
      throw new BadRequestException(messageRetorno);
    }

    if (user.ativo) {
      const messageRetorno = this.i18n.translate('common.auth.conta_ja_ativa', {
        lang: language,
      });
      throw new BadRequestException(messageRetorno);
    }

    const token = generateActivationToken(user.id);

    const activationLink = `${process.env.SITE_URL}/cadastro/confirmar-email?token=${token}&email=${email}&lng=${language}`; //`https://meusite.com/confirmar-email?token=${token}`;

    await this.mailService.sendWelcomeEmail(
      user.email,
      `${user.primeiro_nome} ${user.ultimo_nome}`,
      activationLink,
      language,
    );

    return 'Link de ativação reenviado com sucesso.';
  }
}
