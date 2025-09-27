//import { Controller } from '@nestjs/common';
import {
  Param,
  Controller,
  Get,
  Post,
  Req,
  ParseIntPipe,
  UseGuards,
  Body,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { AvaliadorService } from './avaliador.service';
import { SkillService } from '../skill/skill.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { Request } from 'express';
import { CreateAvaliadorDto } from './dto/create-avaliador.dto';
import { UpdateAvaliadorDto } from './dto/update-avaliador.dto';
import { CreateAvaliadorSkillDto } from './dto/create-avaliador-skill.dto';
import { CreateNovaSkillAvaliadorDto } from './dto/create-nova-skill.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { join, extname } from 'path';
import { existsSync, mkdirSync } from 'fs';

const uploadDir = process.env.UPLOADS_PATH || join(process.cwd(), 'uploads');
if (!existsSync(uploadDir)) {
  mkdirSync(uploadDir, { recursive: true });
}

@Controller('avaliador')
export class AvaliadorController {
  constructor(
    private readonly avaliadorService: AvaliadorService,
    private readonly skillService: SkillService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('check-hasperfil/:perfilId')
  checkPerfil(
    @Param('perfilId', ParseIntPipe) perfilId: number,
    @Req() req: Request & { user: JwtPayload },
  ) {
    const usuarioId = req.user?.sub;

    return this.avaliadorService.getCheckHasPerfil(usuarioId, perfilId);
  }

  //Ese é usado somente no perfil, para ver se existe mesmo que esteja inativo, e poder ativar
  @UseGuards(JwtAuthGuard)
  @Get('check-hasperfil-cadastro/:perfilId')
  checkPerfilCadastro(
    @Param('perfilId', ParseIntPipe) perfilId: number,
    @Req() req: Request & { user: JwtPayload },
  ) {
    const usuarioId = req.user?.sub;

    return this.avaliadorService.getCheckHasPerfilCadastro(usuarioId, perfilId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('create-avaliador')
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
  async createAvaliador(
    @UploadedFiles()
    files: {
      logo?: Express.Multer.File[];
      imagem_fundo?: Express.Multer.File[];
    },
    @Req() req: Request & { user: JwtPayload },
    @Body() body: CreateAvaliadorDto, // <-- adicionar perfil_id no body
  ) {
    const usuarioId = req.user?.sub;

    const BASE_URL = process.env.FILE_BASE_URL || 'http://localhost:3000';

    const skills: CreateAvaliadorSkillDto[] = body.skills
      ? (JSON.parse(body.skills) as CreateAvaliadorSkillDto[])
      : [];

    const novasSkills: CreateNovaSkillAvaliadorDto[] = body.novas_skills
      ? (JSON.parse(body.novas_skills) as CreateNovaSkillAvaliadorDto[])
      : [];

    const avaliador = await this.avaliadorService.createAvaliador({
      usuario_id: usuarioId,
      perfil_id: body.perfilId,
      empresa_id: body.empresaId ?? null,
      telefone: body.telefone,
      localizacao: body.localizacao,
      apresentacao: body.apresentacao,
      avaliar_todos: body.avaliar_todos,
      logo: files.logo?.[0]
        ? `${BASE_URL}/uploads/${files.logo[0].filename}`
        : '',
      meio_notificacao: body.meio_notificacao,
    });

    // Skills já existentes
    const skillsExistentes =
      skills?.map((skill) => ({
        avaliador_id: avaliador.id,
        skill_id: skill.skill_id,
        peso: skill.peso,
        favorito: skill.favorito,
        tempo_favorito: skill.tempo_favorito,
      })) ?? [];

    // Skills novas
    const skillsNovas = await Promise.all(
      (novasSkills ?? []).map(
        async (novaSkill: CreateNovaSkillAvaliadorDto) => {
          const skill = await this.skillService.createOrGetSkill(
            novaSkill.nome,
          );

          return {
            avaliador_id: avaliador.id,
            skill_id: skill.skill_id,
            peso: novaSkill.peso,
            favorito: novaSkill.favorito,
            tempo_favorito: novaSkill.tempo_favorito,
          };
        },
      ),
    );

    const todasSkills = [...skillsExistentes, ...skillsNovas].filter(
      (
        skill,
      ): skill is {
        avaliador_id: number;
        skill_id: number;
        peso: number;
        favorito: boolean;
        tempo_favorito: string;
      } => typeof skill.skill_id === 'number',
    );

    if (todasSkills.length > 0) {
      await this.avaliadorService.createAvaliadorSkills(todasSkills);
    }

    // ✅ Usar perfil_id vindo do body
    const avaliadorCompleto = await this.avaliadorService.getAvaliador(
      avaliador.id,
      usuarioId,
      body.perfilId,
    );

    const avaliadorComSkillsMapeadas = {
      ...avaliadorCompleto,
      skills: avaliadorCompleto?.skills.map((s) => ({
        avaliador_id: s.avaliador_id,
        skill_id: s.skill_id,
        peso: s.peso,
        favorito: s.favorito,
        tempo_favorito: s.tempo_favorito,
        nome: s.skill,
      })),
    };

    return avaliadorComSkillsMapeadas;
  }

  @UseGuards(JwtAuthGuard)
  @Post('update-avaliador')
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
  async updateAvaliador(
    @UploadedFiles()
    files: {
      logo?: Express.Multer.File[];
      imagem_fundo?: Express.Multer.File[];
    },
    @Req() req: Request & { user: JwtPayload },
    @Body() body: UpdateAvaliadorDto, // <-- adicionar perfil_id no body
  ) {
    const usuarioId = req.user?.sub;

    const BASE_URL = process.env.FILE_BASE_URL || 'http://localhost:3000';

    const skills: CreateAvaliadorSkillDto[] = body.skills
      ? (JSON.parse(body.skills) as CreateAvaliadorSkillDto[])
      : [];

    const novasSkills: CreateNovaSkillAvaliadorDto[] = body.novas_skills
      ? (JSON.parse(body.novas_skills) as CreateNovaSkillAvaliadorDto[])
      : [];

    const avaliadorAtual = await this.avaliadorService.getAvaliador(
      body.avaliadorId,
      usuarioId,
      body.perfilId,
    );

    const avaliador = await this.avaliadorService.updateAvaliador({
      avaliador_id: body.avaliadorId,
      usuario_id: usuarioId,
      perfil_id: body.perfilId,
      empresa_id: body.empresaId ?? null,
      telefone: body.telefone,
      localizacao: body.localizacao,
      apresentacao: body.apresentacao,
      avaliar_todos: body.avaliar_todos,
      logo: files.logo?.[0]
        ? `${BASE_URL}/uploads/${files.logo[0].filename}`
        : avaliadorAtual?.logo,
      meio_notificacao: body.meio_notificacao,
      ativo: body.ativo,
    });

    // skills existentes
    const skillsExistentes =
      skills?.map((skill) => ({
        avaliador_id: avaliador.id,
        skill_id: skill.skill_id,
        peso: skill.peso,
        favorito: skill.favorito,
        tempo_favorito: skill.tempo_favorito,
      })) ?? [];

    // novas skills
    const skillsNovas = await Promise.all(
      (novasSkills ?? []).map(async (novaSkill) => {
        const skill = await this.skillService.createOrGetSkill(novaSkill.nome);

        return {
          avaliador_id: avaliador.id,
          skill_id: skill.skill_id,
          peso: novaSkill.peso,
          favorito: novaSkill.favorito,
          tempo_favorito: novaSkill.tempo_favorito,
        };
      }),
    );

    const todasSkills = [...skillsExistentes, ...skillsNovas].filter(
      (
        skill,
      ): skill is {
        avaliador_id: number;
        skill_id: number;
        peso: number;
        favorito: boolean;
        tempo_favorito: string;
      } => typeof skill.skill_id === 'number',
    );

    if (todasSkills.length > 0) {
      await this.avaliadorService.updateAvaliadorSkills(
        body.avaliadorId,
        todasSkills,
      );
    }

    // ✅ usar perfil_id
    const avaliadorCompleto = await this.avaliadorService.getAvaliador(
      avaliador.id,
      usuarioId,
      body.perfilId,
    );

    const avaliadorComSkillsMapeadas = {
      ...avaliadorCompleto,
      skills: avaliadorCompleto?.skills.map((s) => ({
        skill_id: s.skill_id,
        peso: s.peso,
        favorito: s.favorito,
        tempo_favorito: s.tempo_favorito,
        nome: s.skill,
      })),
    };

    return avaliadorComSkillsMapeadas;
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/perfil/:perfilId')
  getAvaliador(
    @Param('id', ParseIntPipe) id: number,
    @Param('perfilId', ParseIntPipe) perfilId: number,
    @Req() req: Request & { user: JwtPayload },
  ) {
    const usuarioId = req.user?.sub;
    return this.avaliadorService.getAvaliador(id, usuarioId, perfilId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('empresas-cadastro')
  getEmpresasCadastro() {
    return this.avaliadorService.getEmpresasCadastro();
  }
}
