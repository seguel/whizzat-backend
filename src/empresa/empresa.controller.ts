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
import { SkillService } from '../skill/skill.service';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { CreateVagaDto } from './dto/create-vaga.dto';
import { CreateNovaSkillDto } from './dto/create-nova-skill.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { join, extname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { Request, Express } from 'express'; // importante: tipar Request e Express
import { usuario_perfil_empresa, empresa_vaga } from '@prisma/client';

const uploadDir = process.env.UPLOADS_PATH || join(process.cwd(), 'uploads');
if (!existsSync(uploadDir)) {
  mkdirSync(uploadDir, { recursive: true });
}

@Controller('empresas')
export class EmpresaController {
  constructor(
    private readonly empresaService: EmpresaService,
    private readonly skillService: SkillService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('create-empresa')
  @UseInterceptors(
    FilesInterceptor('files', 2, {
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
    }),
  )
  async createEmpresa(
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: Request & { user: JwtPayload },
    @Body() body: CreateEmpresaDto,
  ) {
    const usuario_id = req.user?.sub;

    const logoFile = files.find((f) => f.originalname.includes('logo'));
    const capaFile = files.find((f) => f.originalname.includes('capa'));

    const data = {
      usuario_id,
      perfil_id: body.perfilId,
      nome_empresa: body.nome,
      website: body.site,
      email: body.email,
      telefone: body.telefone,
      localizacao: body.localizacao,
      apresentacao: body.apresentacao,
      logo: logoFile?.filename || '',
      imagem_fundo: capaFile?.filename || '',
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

  @Post('create-vaga')
  @UseGuards(JwtAuthGuard)
  async createVaga(
    @Req() req: Request & { user: JwtPayload },
    @Body() body: CreateVagaDto,
  ) {
    const vaga = await this.empresaService.createVaga({
      empresa_id: body.empresa_id,
      nome_vaga: body.nome_vaga,
      descricao: body.descricao,
      local_vaga: body.local_vaga,
      modalidade_trabalho_id: body.modalidade_trabalho_id,
      periodo_trabalho_id: body.periodo_trabalho_id,
      pcd: body.pcd,
      qtde_dias_aberta: body.qtde_dias_aberta,
      qtde_posicao: body.qtde_posicao,
      data_cadastro: new Date(),
    });

    // 1. Skills já existentes com skill_id
    const skillsExistentes =
      body.skills?.map((skill) => ({
        vaga_id: vaga.vaga_id,
        skill_id: skill.skill_id,
        peso: skill.peso,
        avaliador_proprio: skill.avaliador_proprio,
      })) ?? [];

    // 2. Skills novas digitadas pelo usuário
    const skillsNovas = await Promise.all(
      (body.novas_skills ?? []).map(async (novaSkill: CreateNovaSkillDto) => {
        const skill = await this.skillService.createOrGetSkill(novaSkill.nome);

        return {
          vaga_id: vaga.vaga_id,
          skill_id: skill.skill_id,
          peso: novaSkill.peso,
          avaliador_proprio: novaSkill.avaliador_proprio,
        };
      }),
    );

    const todasSkills = [...skillsExistentes, ...skillsNovas].filter(
      (
        skill,
      ): skill is {
        vaga_id: number;
        skill_id: number;
        peso: number;
        avaliador_proprio: boolean;
      } => typeof skill.skill_id === 'number',
    );

    if (todasSkills.length > 0) {
      await this.empresaService.createVagaSkills(todasSkills);
    }

    const vagaCompleta = await this.empresaService.getVaga(vaga.vaga_id);
    const vagaComSkillsMapeadas = {
      ...vagaCompleta,
      skills: vagaCompleta?.skills.map((s) => ({
        skill_id: s.skill_id,
        peso: s.peso,
        avaliador_proprio: s.avaliador_proprio,
        nome: s.skill.skill,
      })),
    };

    return vagaComSkillsMapeadas;
  }

  @UseGuards(JwtAuthGuard)
  @Get('vagas/:empresaId')
  getVagas(
    @Param('empresaId', ParseIntPipe) empresaId: number,
  ): Promise<empresa_vaga[]> {
    return this.empresaService.getVagas(empresaId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('vaga/:id')
  async getVaga(@Param('id', ParseIntPipe) id: number) {
    //return this.empresaService.getVaga(id);
    const vagaCompleta = await this.empresaService.getVaga(id);
    const vagaComSkillsMapeadas = {
      ...vagaCompleta,
      skills: vagaCompleta?.skills.map((s) => ({
        skill_id: s.skill_id,
        peso: s.peso,
        avaliador_proprio: s.avaliador_proprio,
        nome: s.skill.skill,
      })),
    };

    return vagaComSkillsMapeadas;
  }

  @UseGuards(JwtAuthGuard)
  @Get('vagas-sugeridos/:perfilId')
  async getVagasSugeridas(
    @Req() req: Request & { user: JwtPayload },
    @Param('perfilId', ParseIntPipe) perfilId: number,
  ) {
    const usuarioId = req.user?.sub;

    return await this.empresaService.getVagasSugeridas(usuarioId, perfilId);
  }
}
