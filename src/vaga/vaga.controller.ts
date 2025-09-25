import {
  Body,
  Param,
  Controller,
  Get,
  Post,
  Req,
  Query,
  ParseIntPipe,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { VagaService } from './vaga.service';
import { SkillService } from '../skill/skill.service';
import { CreateVagaDto } from './dto/create-vaga.dto';
import { UpdateVagaDto } from './dto/update-vaga.dto';
import { CreateNovaSkillDto } from './dto/create-nova-skill.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { empresa } from '@prisma/client';

@Controller('vagas')
export class VagaController {
  constructor(
    private readonly vagaService: VagaService,
    private readonly skillService: SkillService,
  ) {}

  @Post('create-vaga')
  @UseGuards(JwtAuthGuard)
  async createVaga(
    @Req() req: Request & { user: JwtPayload },
    @Body() body: CreateVagaDto & { recrutador_id: number }, // <-- adicionar perfil_id no body
  ) {
    const vaga = await this.vagaService.createVaga({
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

    // Skills já existentes
    const skillsExistentes =
      body.skills?.map((skill) => ({
        vaga_id: vaga.vaga_id,
        skill_id: skill.skill_id,
        peso: skill.peso,
        avaliador_proprio: skill.avaliador_proprio,
      })) ?? [];

    // Skills novas
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
      await this.vagaService.createVagaSkills(todasSkills);
    }

    // ✅ Usar perfil_id vindo do body
    const vagaCompleta = await this.vagaService.getVaga({
      vaga_id: vaga.vaga_id,
      empresa_id: body.empresa_id,
    });

    const vagaComSkillsMapeadas = {
      ...vagaCompleta,
      skills: vagaCompleta?.skills.map((s) => ({
        skill_id: s.skill_id,
        peso: s.peso,
        avaliador_proprio: s.avaliador_proprio,
        nome: s.skill,
      })),
    };

    return vagaComSkillsMapeadas;
  }

  @Post('update-vaga')
  @UseGuards(JwtAuthGuard)
  async updateVaga(
    @Req() req: Request & { user: JwtPayload },
    @Body() body: UpdateVagaDto & { recrutador_id: number },
  ) {
    const vaga = await this.vagaService.updateVaga({
      vaga_id: body.vaga_id,
      empresa_id: body.empresa_id,
      nome_vaga: body.nome_vaga,
      descricao: body.descricao,
      local_vaga: body.local_vaga,
      modalidade_trabalho_id: body.modalidade_trabalho_id,
      periodo_trabalho_id: body.periodo_trabalho_id,
      pcd: body.pcd,
      qtde_dias_aberta: body.qtde_dias_aberta,
      qtde_posicao: body.qtde_posicao,
      ativo: body.ativo,
    });

    // skills existentes
    const skillsExistentes =
      body.skills?.map((skill) => ({
        vaga_id: vaga.vaga_id,
        skill_id: skill.skill_id,
        peso: skill.peso,
        avaliador_proprio: skill.avaliador_proprio,
      })) ?? [];

    // novas skills
    const skillsNovas = await Promise.all(
      (body.novas_skills ?? []).map(async (novaSkill) => {
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
      await this.vagaService.updateVagaSkills(body.vaga_id, todasSkills);
    }

    // ✅ usar perfil_id
    const vagaCompleta = await this.vagaService.getVaga({
      vaga_id: vaga.vaga_id,
      empresa_id: body.empresa_id,
    });

    const vagaComSkillsMapeadas = {
      ...vagaCompleta,
      skills: vagaCompleta?.skills.map((s) => ({
        skill_id: s.skill_id,
        peso: s.peso,
        avaliador_proprio: s.avaliador_proprio,
        nome: s.skill,
      })),
    };

    return vagaComSkillsMapeadas;
  }

  @UseGuards(JwtAuthGuard)
  @Get('vagas/:empresaId')
  getVagas(@Param('empresaId', ParseIntPipe) empresaId: number): Promise<{
    empresa_id: number;
    vagas: empresa[];
  }> {
    return this.vagaService.getVagas(empresaId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':vaga_id/empresa/:empresa_id')
  async getVaga(
    @Param('vaga_id', ParseIntPipe) vaga_id: number,
    @Param('empresa_id', ParseIntPipe) empresa_id: number,
  ) {
    const vagaCompleta = await this.vagaService.getVaga({
      vaga_id,
      empresa_id,
    });

    if (!vagaCompleta) {
      throw new NotFoundException(
        'Vaga não encontrada ou acesso não autorizado.',
      );
    }

    const vagaComSkillsMapeadas = {
      ...vagaCompleta,
      skills: vagaCompleta.skills.map((s) => ({
        skill_id: s.skill_id,
        peso: s.peso,
        avaliador_proprio: s.avaliador_proprio,
        nome: s.skill,
      })),
    };

    return vagaComSkillsMapeadas;
  }

  @UseGuards(JwtAuthGuard)
  @Get('vagas-abertas/:recrutadorId')
  async getVagasSugeridas(
    @Req() req: Request & { user: JwtPayload },
    @Param('recrutadorId', ParseIntPipe) recrutadorId: number,
    @Query('empresaId') empresaId?: string,
    @Query('skill') skill?: string,
  ) {
    const usuarioId = req.user?.sub;

    // Se não foi enviado, considerar "todos"
    const empresaFiltro = empresaId || 'todos';
    const skillFiltro = skill || 'todos';

    return await this.vagaService.getVagasAbertas(
      usuarioId,
      recrutadorId,
      empresaFiltro,
      skillFiltro,
    );
  }
}
