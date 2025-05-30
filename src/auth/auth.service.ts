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

interface JwtPayload {
  userId: number;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  async register(data: RegisterDto) {
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

    const activationLink = `${process.env.SITE_URL}/cadastro/confirmar-email?token=${token}&email=${email}`; //`https://meusite.com/confirmar-email?token=${token}`;

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

  async requestPasswordReset(email: string): Promise<string> {
    const user = await this.prisma.usuario.findUnique({ where: { email } });
    if (!user)
      return 'Se o e-mail existir, um link será enviado ao email informado.'; // evita user enumeration

    const token = generateResetTokenCurto(user.id);

    const Link = `${process.env.SITE_URL}/cadastro/redefinir-senha?token=${token}&email=${email}`; //`https://meusite.com/confirmar-email?token=${token}`;

    await this.mailService.sendPasswordResetEmail(
      email,
      `${user.primeiro_nome} ${user.ultimo_nome}`,
      Link,
    );

    return 'Se o e-mail existir, um link será enviado ao email informado.';
  }

  async resetPassword(dto: ResetPasswordDto) {
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

      return { message: 'Senha redefinida com sucesso.' };
    } catch {
      throw new BadRequestException('Token inválido ou expirado.');
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
  ): Promise<LoginDto | null> {
    const user = await this.prisma.usuario.findFirst({
      where: { email },
    });

    if (!user) return null;

    const isMatch = await bcrypt.compare(password, user.senha);
    if (!isMatch) throw new UnauthorizedException('Credenciais inválidas');

    //const {email, senha: _, ...userData } = user;
    const userData: LoginDto = { email, senha: password };
    return userData;
  }

  async activateUserByToken(token: string) {
    try {
      const payload = jwt.verify(
        token,
        process.env.JWT_ACTIVATE_SECRET!,
      ) as JwtPayload;

      const user = await this.prisma.usuario.findUnique({
        where: { id: payload.userId },
      });

      if (!user) throw new Error('Usuário não encontrado');
      if (user.ativo) return user;

      return await this.prisma.usuario.update({
        where: { id: user.id },
        data: { ativo: true },
      });
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        throw new BadRequestException('Token expirado. Solicite novo link.');
      } else {
        throw new BadRequestException('Token inválido.');
      }
    }
  }
  async resendActivationLink(email: string): Promise<string> {
    const user = await this.prisma.usuario.findUnique({
      where: { email },
    });

    if (!user) throw new BadRequestException('Usuário não encontrado.');
    if (user.ativo) throw new BadRequestException('Conta já está ativada.');

    const token = generateActivationToken(user.id);

    const activationLink = `${process.env.SITE_URL}/cadastro/confirmar-email?token=${token}&email=${email}`; //`https://meusite.com/confirmar-email?token=${token}`;

    await this.mailService.sendWelcomeEmail(
      user.email,
      `${user.primeiro_nome} ${user.ultimo_nome}`,
      activationLink,
    );

    return 'Link de ativação reenviado com sucesso.';
  }
}
