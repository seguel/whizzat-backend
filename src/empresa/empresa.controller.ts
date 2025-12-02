// src/empresa/empresa.controller.ts
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
  BadRequestException,
} from '@nestjs/common';
import { EmpresaService } from './empresa.service';

import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { join, extname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { Request, Express } from 'express'; // importante: tipar Request e Express
import { empresa } from '@prisma/client';

const uploadDir = process.env.UPLOADS_PATH || join(process.cwd(), 'uploads');
if (!existsSync(uploadDir)) {
  mkdirSync(uploadDir, { recursive: true });
}

@Controller('empresas')
export class EmpresaController {
  constructor(private readonly empresaService: EmpresaService) {}

  @UseGuards(JwtAuthGuard)
  @Post('create-empresa')
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
        fileFilter: (req, file, cb) => {
          const allowedExt = /(\.jpg|\.jpeg|\.png|\.webp|\.svg)$/i;
          const allowedMime = /image\/(jpeg|png|webp|svg)/;

          const extValid = allowedExt.test(file.originalname);
          const mimeValid = allowedMime.test(file.mimetype);

          if (extValid && mimeValid) {
            cb(null, true);
          } else {
            cb(
              new BadRequestException(
                'Apenas arquivos de imagem (JPG, PNG, WEBP, SVG) são permitidos.',
              ),
              false,
            );
          }
        },
      },
    ),
  )
  async createEmpresa(
    @UploadedFiles()
    files: {
      logo?: Express.Multer.File[];
      imagem_fundo?: Express.Multer.File[];
    },
    @Req() req: Request & { user: JwtPayload },
    @Body() body: CreateEmpresaDto,
  ) {
    const usuario_id = req.user?.sub;
    const lang = req.user?.lang ?? 'pt';

    // Base URL para frontend
    const BASE_URL = process.env.FILE_BASE_URL || 'http://localhost:3000';

    const data = {
      usuario_id,
      perfil_id: body.perfilId,
      recrutador_id: body.recrutadorId,
      nome_empresa: body.nome,
      website: body.site,
      email: body.email,
      telefone: body.telefone,
      localizacao: '',
      apresentacao: body.apresentacao,
      logo: files.logo?.[0]
        ? `${BASE_URL}/uploads/${files.logo[0].filename}`
        : '',
      imagem_fundo: files.imagem_fundo?.[0]
        ? `${BASE_URL}/uploads/${files.imagem_fundo[0].filename}`
        : '',
      linguagem: lang,
      cidade_id: body.cidade_id,
    };

    return this.empresaService.createEmpresa(data);
  }

  @UseGuards(JwtAuthGuard)
  @Post('update-empresa')
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
          const allowedExt = /(\.jpg|\.jpeg|\.png|\.webp|\.svg)$/i;
          const allowedMime = /image\/(jpeg|png|webp|svg)/;

          const extValid = allowedExt.test(file.originalname);
          const mimeValid = allowedMime.test(file.mimetype);

          if (extValid && mimeValid) {
            cb(null, true);
          } else {
            cb(
              new BadRequestException(
                'Apenas arquivos de imagem (JPG, PNG, WEBP, SVG) são permitidos.',
              ),
              false,
            );
          }
        },
      },
    ),
  )
  async updateEmpresa(
    @UploadedFiles()
    files: {
      logo?: Express.Multer.File[];
      imagem_fundo?: Express.Multer.File[];
    },
    @Req() req: Request & { user: JwtPayload },
    @Body() body: UpdateEmpresaDto,
  ) {
    //const usuario_id = req.user?.sub;

    /* const logoFile = files[0];
    const capaFile = files[1];
 */
    const BASE_URL = process.env.FILE_BASE_URL || 'http://localhost:3000';

    const data = {
      recrutador_id: body.recrutadorId,
      empresa_id: body.empresa_id, // 👈 vem do novo DTO
      perfil_id: body.perfilId,
      nome_empresa: body.nome,
      website: body.site,
      email: body.email,
      telefone: body.telefone,
      localizacao: '',
      apresentacao: body.apresentacao,
      logo: files.logo?.[0]
        ? `${BASE_URL}/uploads/${files.logo[0].filename}`
        : undefined,
      imagem_fundo: files.imagem_fundo?.[0]
        ? `${BASE_URL}/uploads/${files.imagem_fundo[0].filename}`
        : undefined,
      ativo: body.ativo,
      cidade_id: body.cidade_id,
    };
    return this.empresaService.updateEmpresa(data);
  }

  @UseGuards(JwtAuthGuard)
  @Get('recrutador/:recrutadorId')
  getEmpresasRecrutador(
    @Param('recrutadorId', ParseIntPipe) recrutadorId: number,
    @Req() req: Request & { user: JwtPayload },
  ): Promise<{
    usuario_id: number;
    empresas: empresa[];
  }> {
    const usuarioId = req.user?.sub;
    return this.empresaService.getEmpresasRecrutador(recrutadorId, usuarioId);
  }

  //Utilizado para listar empresas ativas, por exemplo usar em um combo de filtro em vagas abertas
  //no perfil passado, geralmente no recrutador
  @UseGuards(JwtAuthGuard)
  @Get('filtro-ativas/:recrutadorId')
  getEmpresasAtivas(
    @Param('recrutadorId', ParseIntPipe) recrutadorId: number,
    @Req() req: Request & { user: JwtPayload },
  ): Promise<{
    usuario_id: number;
    empresas: empresa[];
  }> {
    const usuarioId = req.user?.sub;
    const lang = req.user?.lang ?? 'pt';
    return this.empresaService.getEmpresasAtivas(recrutadorId, usuarioId, lang);
  }

  @UseGuards(JwtAuthGuard)
  @Get('filtro-ativas-all')
  getEmpresasAtivasAll(@Req() req: Request & { user: JwtPayload }): Promise<{
    empresas: empresa[];
  }> {
    const lang = req.user?.lang ?? 'pt';
    return this.empresaService.getEmpresasAtivasAll(lang);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/recrutador/:recrutadorId')
  getEmpresa(
    @Param('id', ParseIntPipe) id: number,
    @Param('recrutadorId', ParseIntPipe) recrutadorId: number,
    // @Req() req: Request & { user: JwtPayload },
  ) {
    //const usuarioId = req.user?.sub;
    return this.empresaService.getEmpresa(recrutadorId, id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('lista-vagas-empresa/:empresaId')
  getListaVagasAtivas(@Param('empresaId', ParseIntPipe) empresaId: number) {
    return this.empresaService.getListaVagasAtivasEmpresa(empresaId);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  getEmpresas(@Req() req: Request & { user: JwtPayload }): Promise<{
    empresas: empresa[];
  }> {
    const lang = req.user?.lang ?? 'pt';
    return this.empresaService.getEmpresas(lang);
  }
}
