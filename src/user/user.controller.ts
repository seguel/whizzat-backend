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

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  createUser(@Body() data: usuario): Promise<usuario> {
    return this.userService.createUser(data);
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
