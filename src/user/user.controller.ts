import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  //Delete,
  ParseIntPipe,
  Patch,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { usuario } from '@prisma/client';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { Request, Response } from 'express';
import { RegisterDto } from './dto/register.dto';
import { Prisma } from '@prisma/client';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async createUser(@Body() data: RegisterDto): Promise<usuario> {
    const prismaData: Prisma.usuarioCreateInput = {
      primeiro_nome: data.primeiro_nome,
      ultimo_nome: data.ultimo_nome,
      email: data.email,
      senha: data.senha,
      linguagem: data.linguagem,
      data_nascimento: data.data_nascimento,
      nome_social: data.nome_social ?? null,

      genero: { connect: { id: data.genero_id } },
      cidade: { connect: { id: data.cidade_id } },
    };

    return this.userService.createUser(prismaData);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  getUsers(): Promise<usuario[]> {
    return this.userService.getUsers();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  getUser(@Param('id', ParseIntPipe) id: number): Promise<usuario | null> {
    return this.userService.getUser(id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: Partial<usuario>,
  ): Promise<usuario> {
    return this.userService.updateUser(id, data);
  }

  @Patch('perfil')
  @UseGuards(JwtAuthGuard)
  async atualizarPerfil(
    @Req() req: Request & { user: JwtPayload },
    @Res({ passthrough: true }) res: Response,
    @Body() body: { id_perfil: number },
  ) {
    const user = req.user;
    const lang = req.user?.lang ?? 'pt';

    if (!user?.sub) {
      throw new UnauthorizedException('Usuário não autenticado');
    }

    // Limpa o cookie antigo
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
    });

    // Aguarda o retorno corretamente
    const result = await this.userService.updateUserPerfil(
      user.sub,
      { id_perfil: body.id_perfil },
      user.email,
      user.nome,
      lang,
    );

    // Define novo token com payload atualizado
    res.cookie('token', result.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
      maxAge: 60 * 60 * 1000, // 1 hora
    });

    return { user: result.user };
  }

  /* @Delete(':id')
  deleteUser(@Param('id', ParseIntPipe) id: number): Promise<usuario> {
    return this.userService.deleteUser(id);
  } */
}
