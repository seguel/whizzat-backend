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
  NotFoundException,
} from '@nestjs/common';
import { EmpresaService } from './empresa.service';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { Express } from 'express';
import { usuario_perfil_empresa } from '@prisma/client';

const uploadDir = './uploads';
if (!existsSync(uploadDir)) {
  mkdirSync(uploadDir);
}

@Controller('empresas')
export class EmpresaController {
  constructor(private readonly empresaService: EmpresaService) {}

  @UseGuards(JwtAuthGuard)
  @Post('create-empresa')
  @UseInterceptors(
    FilesInterceptor('files', 2, {
      storage: diskStorage({
        destination: uploadDir,
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
        },
      }),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
      fileFilter: (
        req: Express.Request,
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
    }),
  )
  async createEmpresa(
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: Request & { user: JwtPayload },
    @Body() body: CreateEmpresaDto,
  ) {
    const usuario_id = req.user?.sub;

    // Extrair os arquivos corretamente
    const logoFile: Express.Multer.File | undefined = files.find(
      (f: Express.Multer.File) => f.originalname.includes('logo'),
    );
    const capaFile: Express.Multer.File | undefined = files.find(
      (f: Express.Multer.File) => f.originalname.includes('capa'),
    );
    /* 
    console.log(logoFile);

    return { message: 'ok' }; */

    // Montar o objeto com os dados e os nomes dos arquivos salvos
    const data = {
      usuario_id,
      perfil_id: body.perfilId,
      nome_empresa: body.nome,
      website: body.site,
      email: body.email,
      telefone: body.telefone,
      localizacao: body.localizacao,
      apresentacao: body.apresentacao,
      logo: logoFile ? logoFile.filename : '', // pegar o nome gerado pelo multer
      imagem_fundo: capaFile ? capaFile.filename : '', // idem
    };

    return this.empresaService.createEmpresa(data);
  }

  @UseGuards(JwtAuthGuard)
  @Get('vinculo/:perfilId')
  getEmpresas(
    @Param('perfilId', ParseIntPipe) perfilId: number,
    @Req() req: Request & { user: JwtPayload },
  ): Promise<usuario_perfil_empresa[]> {
    const usuarioId = req.user?.sub;
    return this.empresaService.getEmpresas(usuarioId, perfilId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  getEmpresa(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<usuario_perfil_empresa | null> {
    return this.empresaService.getEmpresa(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('verificar-vinculo/:perfil')
  async verificarVinculo(
    @Param('perfil', ParseIntPipe) perfil: number,
    @Req() req: Request & { user: JwtPayload },
  ) {
    // Aqui você acessa o payload do JWT
    const usuarioId = req.user?.sub;

    const existe = await this.empresaService.hasPerfilInEmpresa(
      usuarioId,
      perfil,
    );

    if (!existe) {
      throw new NotFoundException(
        'Usuário não possui vínculo com o perfil solicitado.',
      );
    }

    return {
      success: true,
      message: 'Vínculo encontrado.',
    };
  }
}
