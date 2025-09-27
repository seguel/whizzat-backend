import { RecrutadorService } from './recrutador.service';
import {
  Body,
  Param,
  Controller,
  Get,
  Post,
  Req,
  ParseIntPipe,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  NotFoundException,
} from '@nestjs/common';
import { CreateRecrutadorDto } from './dto/create-recrutador.dto';
import { UpdateRecrutadorDto } from './dto/update-recrutador.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { Request } from 'express';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { join, extname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { usuario_perfil_recrutador } from '@prisma/client';

const uploadDir = process.env.UPLOADS_PATH || join(process.cwd(), 'uploads');
if (!existsSync(uploadDir)) {
  mkdirSync(uploadDir, { recursive: true });
}

@Controller('recrutador')
export class RecrutadorController {
  constructor(private readonly recrutadorService: RecrutadorService) {}

  @UseGuards(JwtAuthGuard)
  @Get('check-hasperfil/:perfilId')
  checkPerfil(
    @Param('perfilId', ParseIntPipe) perfilId: number,
    @Req() req: Request & { user: JwtPayload },
  ) {
    const usuarioId = req.user?.sub;

    return this.recrutadorService.getCheckHasPerfil(usuarioId, perfilId);
  }

  //Ese é usado somente no perfil, para ver se existe mesmo que esteja inativo, e poder ativar
  @UseGuards(JwtAuthGuard)
  @Get('check-hasperfil-cadastro/:perfilId')
  checkPerfilCadastro(
    @Param('perfilId', ParseIntPipe) perfilId: number,
    @Req() req: Request & { user: JwtPayload },
  ) {
    const usuarioId = req.user?.sub;

    return this.recrutadorService.getCheckHasPerfilCadastro(
      usuarioId,
      perfilId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('vinculo-empresa/:recrutadorId')
  async verificarVinculoEmpresa(
    @Param('recrutadorId', ParseIntPipe) recrutadorId: number,
  ) {
    const existe =
      await this.recrutadorService.hasPerfilInEmpresa(recrutadorId);

    if (!existe) {
      throw new NotFoundException('Perfil não possuí vinculo com empresas.');
    }

    return {
      success: true,
      message: 'Vínculo encontrado.',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('create-recrutador')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'logo', maxCount: 1 },
        { name: 'imagem_fundo', maxCount: 1 },
      ],
      {
        storage: diskStorage({
          destination: uploadDir,
          filename: (
            req: Request,
            file: Express.Multer.File,
            cb: (error: Error | null, filename: string) => void,
          ) => {
            const uniqueSuffix =
              Date.now() + '-' + Math.round(Math.random() * 1e9);
            const ext = extname(file.originalname);
            cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
          },
        }),
        limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
        fileFilter: (
          req: Request,
          file: Express.Multer.File,
          cb: (error: Error | null, acceptFile: boolean) => void,
        ) => {
          const allowedTypes = /jpeg|jpg|png|webp/;
          const isValid = allowedTypes.test(file.mimetype);

          if (isValid) {
            cb(null, true);
          } else {
            cb(new Error('Apenas arquivos de imagem são permitidos.'), false);
          }
        },
      },
    ),
  )
  async createRecrutador(
    @UploadedFiles()
    files: {
      logo?: Express.Multer.File[];
      imagem_fundo?: Express.Multer.File[];
    },
    @Req() req: Request & { user: JwtPayload },
    @Body() body: CreateRecrutadorDto,
  ) {
    const usuario_id = req.user?.sub;

    // Base URL para frontend
    const BASE_URL = process.env.FILE_BASE_URL || 'http://localhost:3000';
    /* console.log('files recebido:', files);
    console.log('body recebido:', body); */
    const data = {
      usuario_id: usuario_id,
      perfil_id: Number(body.perfilId),
      telefone: body.telefone,
      localizacao: body.localizacao,
      apresentacao: body.apresentacao,
      meio_notificacao: body.meio_notificacao,
      logo: files.logo?.[0]
        ? `${BASE_URL}/uploads/${files.logo[0].filename}`
        : '',
    };

    return this.recrutadorService.createRecrutador(data);
  }

  @UseGuards(JwtAuthGuard)
  @Post('update-recrutador')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'logo', maxCount: 1 },
        { name: 'imagem_fundo', maxCount: 1 },
      ],
      {
        storage: diskStorage({
          destination: uploadDir,
          filename: (req, file, cb) => {
            const uniqueSuffix =
              Date.now() + '-' + Math.round(Math.random() * 1e9);
            const ext = extname(file.originalname);
            cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
          },
        }),
        limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
        fileFilter: (req, file, cb) => {
          const allowedTypes = /jpeg|jpg|png|webp/;
          const isValid = allowedTypes.test(file.mimetype);
          if (isValid) cb(null, true);
          else
            cb(new Error('Apenas arquivos de imagem são permitidos.'), false);
        },
      },
    ),
  )
  async updateRerutador(
    @UploadedFiles()
    files: {
      logo?: Express.Multer.File[];
      imagem_fundo?: Express.Multer.File[];
    },
    @Req() req: Request & { user: JwtPayload },
    @Body() body: UpdateRecrutadorDto,
  ) {
    //const usuario_id = req.user?.sub;

    const BASE_URL = process.env.FILE_BASE_URL || 'http://localhost:3000';

    const data = {
      id: body.recrutadorId,
      telefone: body.telefone,
      localizacao: body.localizacao,
      apresentacao: body.apresentacao,
      meio_notificacao: body.meio_notificacao,
      logo: files.logo?.[0]
        ? `${BASE_URL}/uploads/${files.logo[0].filename}`
        : '',
      ativo: body.ativo,
    };
    return this.recrutadorService.updateRecrutador(data);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/perfil/:perfilId')
  getRecrutador(
    @Param('id', ParseIntPipe) id: number,
    @Param('perfilId', ParseIntPipe) perfilId: number,
    @Req() req: Request & { user: JwtPayload },
  ): Promise<usuario_perfil_recrutador | null> {
    const usuarioId = req.user?.sub;
    return this.recrutadorService.getRecrutador(id, usuarioId, perfilId);
  }
}
