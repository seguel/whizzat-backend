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
  Headers,
  BadRequestException,
} from '@nestjs/common';
import { AvaliadorService } from './avaliador.service';
import { SkillService } from '../skill/skill.service';
import { CertificacoesService } from '../certificacoes/certificacoes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { Request } from 'express';
import { CreateAvaliadorDto } from './dto/create-avaliador.dto';
import { UpdateAvaliadorDto } from './dto/update-avaliador.dto';
import { CreateAvaliadorSkillDto } from './dto/create-avaliador-skill.dto';
import { CreateNovaSkillAvaliadorDto } from './dto/create-nova-skill.dto';
import { CreateAvaliadorFormacaoDto } from './dto/create-avaliador-formacao.dto';
import { CreateAvaliadorCertificadosDto } from './dto/create-avaliador-certificados.dto';
import { CreateNovoCertificadoAvaliadorDto } from './dto/create-novo-certificado.dto';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { join, extname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { I18nService } from 'nestjs-i18n';
import { safeJsonParse } from '../lib/safe-json-parse';

const uploadDir = process.env.UPLOADS_PATH || join(process.cwd(), 'uploads');
if (!existsSync(uploadDir)) {
  mkdirSync(uploadDir, { recursive: true });
}

@Controller('avaliador')
export class AvaliadorController {
  constructor(
    private readonly avaliadorService: AvaliadorService,
    private readonly skillService: SkillService,
    private readonly certificacoesService: CertificacoesService,
    private readonly i18n: I18nService,
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
    const nomeUser = req.user?.nome;

    return this.avaliadorService.getCheckHasPerfilCadastro(
      usuarioId,
      perfilId,
      nomeUser,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('create-avaliador')
  @UseInterceptors(
    AnyFilesInterceptor({
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
      limits: { fileSize: 10 * 1024 * 1024 }, // até 10MB
    }),
  )
  async createAvaliador(
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: Request & { user: JwtPayload },
    @Body() body: CreateAvaliadorDto,
  ) {
    /* console.log(
      'Arquivos recebidos:',
      files.map((f) => ({
        field: f.fieldname,
        name: f.originalname,
        mimetype: f.mimetype,
      })),
    ); */
    const usuarioId = req.user?.sub;
    const nomeUser = req.user?.nome;
    const BASE_URL = process.env.FILE_BASE_URL || 'http://localhost:3000';

    // Separar arquivos por prefixo
    const logoFile = files.find((f) => f.fieldname === 'logo');
    const formacaoCertificados = files.filter((f) =>
      f.fieldname.startsWith('formacao_certificado_'),
    );
    const certificacaoCertificados = files.filter((f) =>
      f.fieldname.startsWith('certificado_'),
    );

    // Parse seguro dos dados
    const formacoes = safeJsonParse<CreateAvaliadorFormacaoDto[]>(
      body.formacoes,
    );
    const certificados = safeJsonParse<CreateAvaliadorCertificadosDto[]>(
      body.certificacoes,
    );
    const novosCertificados = safeJsonParse<
      CreateNovoCertificadoAvaliadorDto[]
    >(body.novas_certificacoes);
    const skills = safeJsonParse<CreateAvaliadorSkillDto[]>(body.skills);
    const novasSkills = safeJsonParse<CreateNovaSkillAvaliadorDto[]>(
      body.novas_skills,
    );

    // Cria o avaliador
    const avaliador = await this.avaliadorService.createAvaliador({
      usuario_id: usuarioId,
      perfil_id: body.perfilId,
      empresa_id: body.empresaId ? Number(body.empresaId) : null,
      telefone: body.telefone,
      localizacao: body.localizacao,
      apresentacao: body.apresentacao,
      avaliar_todos: body.avaliar_todos,
      logo: logoFile ? `${BASE_URL}/uploads/${logoFile.filename}` : '',
      meio_notificacao: body.meio_notificacao,
      status_cadastro: body.empresaId ? -1 : 1,
      language: 'pt',
    });

    // Monta formacoes
    const montaFormacoes =
      formacoes?.map((formacao) => {
        const file = formacaoCertificados.find(
          (f) => f.fieldname === formacao.certificado_field,
        );
        return {
          avaliador_id: avaliador.id,
          graduacao_id: formacao.graduacao_id,
          formacao: formacao.formacao ?? '',
          certificado_file: file ? `${BASE_URL}/uploads/${file.filename}` : '',
        };
      }) ?? [];

    if (montaFormacoes.length > 0) {
      await this.avaliadorService.createAvaliadorFormacao(montaFormacoes);
    }

    // console.log(certificados);
    // console.log(novosCertificados);
    // console.log('----');

    // certificações já existentes
    const certificacoesExistentes =
      certificados?.map((certificado) => ({
        avaliador_id: avaliador.id,
        certificacao_id: Number(certificado.certificacao_id),
      })) ?? [];

    // certificações novas
    const certificacoesNovas = await Promise.all(
      (novosCertificados ?? []).map(
        async (novoCertificado: CreateNovoCertificadoAvaliadorDto) => {
          const certificado =
            await this.certificacoesService.createOrGetCertificado(
              novoCertificado.certificado,
            );
          return {
            avaliador_id: avaliador.id,
            certificacao_id: Number(certificado.id),
          };
        },
      ),
    );

    // console.log(certificacoesExistentes);
    // console.log(certificacoesNovas);
    // return;

    // Junta todas as certificações e anexa o arquivo (file) correspondente
    const todasCertificacoes = [
      ...certificacoesExistentes,
      ...certificacoesNovas,
    ].map((certificado, index) => {
      const file = certificacaoCertificados[index]; // pega o arquivo pelo index
      return {
        avaliador_id: certificado.avaliador_id,
        certificacao_id: certificado.certificacao_id,
        certificado_file: file ? `${BASE_URL}/uploads/${file.filename}` : '',
      };
    });

    // Filtra apenas certificações válidas (ID numérico)
    const todasCertificacoesValidas = todasCertificacoes.filter(
      (c) => typeof c.certificacao_id === 'number' && !isNaN(c.certificacao_id),
    );

    if (todasCertificacoesValidas.length > 0) {
      await this.avaliadorService.createAvaliadorCertificacoes(
        todasCertificacoesValidas,
      );
    }

    // Skills existentes
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
        nome: string;
      } => typeof skill.skill_id === 'number',
    );

    if (todasSkills.length > 0) {
      await this.avaliadorService.createAvaliadorSkills(todasSkills);
    }

    // Retorna avaliador completo
    const avaliadorCompleto = await this.avaliadorService.getAvaliador(
      avaliador.id,
      usuarioId,
      body.perfilId,
      nomeUser,
    );

    return {
      ...avaliadorCompleto,
      skills: avaliadorCompleto?.skills?.map((s) => ({
        avaliador_id: s.avaliador_id,
        skill_id: s.skill_id,
        peso: s.peso,
        favorito: s.favorito,
        tempo_favorito: s.tempo_favorito,
        nome: s.nome,
      })),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('update-avaliador')
  @UseInterceptors(
    AnyFilesInterceptor({
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
      limits: { fileSize: 10 * 1024 * 1024 }, // até 10MB
    }),
  )
  async updateAvaliador(
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: Request & { user: JwtPayload },
    @Body() body: UpdateAvaliadorDto, // <-- adicionar perfil_id no body
  ) {
    const usuarioId = req.user?.sub;
    const nomeUser = req.user?.nome;

    const BASE_URL = process.env.FILE_BASE_URL || 'http://localhost:3000';

    // Separar arquivos por prefixo
    const logoFile = files.find((f) => f.fieldname === 'logo');
    const formacaoCertificados = files.filter((f) =>
      f.fieldname.startsWith('formacao_certificado_'),
    );
    const certificacaoCertificados = files.filter((f) =>
      f.fieldname.startsWith('certificado_'),
    );
    // console.log(certificacaoCertificados);

    // Parse seguro dos dados
    const formacoes = safeJsonParse<CreateAvaliadorFormacaoDto[]>(
      body.formacoes,
    );
    const certificados = safeJsonParse<CreateAvaliadorCertificadosDto[]>(
      body.certificacoes,
    );
    const novosCertificados = safeJsonParse<
      CreateNovoCertificadoAvaliadorDto[]
    >(body.novas_certificacoes);
    const skills = safeJsonParse<CreateAvaliadorSkillDto[]>(body.skills);
    const novasSkills = safeJsonParse<CreateNovaSkillAvaliadorDto[]>(
      body.novas_skills,
    );

    const avaliadorAtual = await this.avaliadorService.getAvaliador(
      body.avaliadorId,
      usuarioId,
      body.perfilId,
      nomeUser,
    );

    const avaliador = await this.avaliadorService.updateAvaliador({
      avaliador_id: body.avaliadorId,
      usuario_id: usuarioId,
      perfil_id: body.perfilId,
      empresa_id: body.empresaId ? Number(body.empresaId) : null,
      telefone: body.telefone,
      localizacao: body.localizacao,
      apresentacao: body.apresentacao,
      avaliar_todos: body.avaliar_todos,
      logo: logoFile
        ? `${BASE_URL}/uploads/${logoFile.filename}`
        : avaliadorAtual?.logo,
      meio_notificacao: body.meio_notificacao,
      ativo: body.ativo,
      language: 'pt',
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

    // Monta formacoes
    const montaFormacoes =
      formacoes?.map((formacao) => {
        const file = formacaoCertificados.find(
          (f) => f.fieldname === formacao.certificado_field,
        );
        return {
          avaliador_id: avaliador.id,
          graduacao_id: formacao.graduacao_id,
          formacao: formacao.formacao ?? '',
          certificado_file: file ? `${BASE_URL}/uploads/${file.filename}` : '',
        };
      }) ?? [];

    // if (montaFormacoes.length > 0) {
    await this.avaliadorService.updateAvaliadorFormacao(
      body.avaliadorId,
      montaFormacoes,
    );
    // }

    // certificações já existentes
    const certificacoesExistentes =
      certificados?.map((certificado) => ({
        avaliador_id: avaliador.id,
        certificacao_id: Number(certificado.certificacao_id),
        certificado_field: certificado.certificado_field ?? undefined,
      })) ?? [];

    // certificações novas
    const certificacoesNovas = await Promise.all(
      (novosCertificados ?? [])
        .filter((c) => Number(c.certificacao_id) < 0)
        .map(
          async (
            novoCertificado: CreateNovoCertificadoAvaliadorDto & {
              certificado_field?: string;
            },
          ) => {
            const certificado =
              await this.certificacoesService.createOrGetCertificado(
                novoCertificado.certificado,
              );

            return {
              avaliador_id: avaliador.id,
              certificacao_id: Number(certificado.id),
              certificado_field: novoCertificado.certificado_field ?? undefined,
            };
          },
        ),
    );

    // console.log(certificacoesExistentes);

    // Junta todas as certificações e anexa o arquivo (file) correspondente
    const todasCertificacoes = [
      ...certificacoesExistentes,
      ...certificacoesNovas,
    ]
      .filter((c) => Number(c.certificacao_id) > 0)
      .map((certificado) => {
        const file = certificacaoCertificados.find(
          (f) => f.fieldname === certificado.certificado_field,
        );
        return {
          avaliador_id: certificado.avaliador_id,
          certificacao_id: certificado.certificacao_id,
          certificado_file: file ? `${BASE_URL}/uploads/${file.filename}` : '',
        };
      });

    // Filtra apenas certificações válidas (ID numérico)
    const todasCertificacoesValidas = todasCertificacoes.filter(
      (c) => typeof c.certificacao_id === 'number' && !isNaN(c.certificacao_id),
    );

    // console.log(todasCertificacoesValidas);

    // if (todasCertificacoesValidas.length > 0) {
    await this.avaliadorService.updateAvaliadorCertificacoes(
      body.avaliadorId,
      todasCertificacoesValidas,
    );
    // }

    // ✅ usar perfil_id
    const avaliadorCompleto = await this.avaliadorService.getAvaliador(
      avaliador.id,
      usuarioId,
      body.perfilId,
      nomeUser,
    );

    const avaliadorComSkillsMapeadas = {
      ...avaliadorCompleto,
      skills: avaliadorCompleto?.skills?.map((s) => ({
        skill_id: s.skill_id,
        peso: s.peso,
        favorito: s.favorito,
        tempo_favorito: s.tempo_favorito,
        nome: s.nome,
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
    const nomeUser = req.user?.nome;

    return this.avaliadorService.getAvaliador(
      id,
      usuarioId,
      perfilId,
      nomeUser,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('empresas-cadastro')
  getEmpresasCadastro() {
    return this.avaliadorService.getEmpresasCadastro();
  }

  @UseGuards(JwtAuthGuard)
  @Post('reenviar-solicitacao/:id')
  resendLink(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request & { user: JwtPayload },
  ) {
    const usuarioId = req.user?.sub;

    return this.avaliadorService.resendLink(id, usuarioId);
  }

  @Post('activate')
  async activateAccount(
    @Body('token') token: string,
    @Headers('accept-language') language: string,
  ) {
    if (!token) {
      const messageRetorno = this.i18n.translate('common.auth.token_invalido', {
        lang: language,
      });
      throw new BadRequestException(messageRetorno);
    }

    const user = await this.avaliadorService.activateUserByToken(
      token,
      language,
      3,
    );
    const messageRetorno = this.i18n.translate(
      'common.auth.conta_ativada_sucesso',
      {
        lang: language,
      },
    );
    return { message: messageRetorno, user };
  }

  @Post('reject')
  async rejectAccount(
    @Body('token') token: string,
    @Headers('accept-language') language: string,
  ) {
    if (!token) {
      const messageRetorno = this.i18n.translate('common.auth.token_invalido', {
        lang: language,
      });
      throw new BadRequestException(messageRetorno);
    }

    const user = await this.avaliadorService.rejectUserByToken(
      token,
      language,
      3,
    );
    const messageRetorno = this.i18n.translate(
      'common.auth.conta_reject_sucesso',
      {
        lang: language,
      },
    );
    return { message: messageRetorno, user };
  }
}
