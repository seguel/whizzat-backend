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
import { CandidatoService } from './candidato.service';
import { SkillService } from '../skill/skill.service';
import { CertificacoesService } from '../certificacoes/certificacoes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { Request } from 'express';
import { CreateCandidatoDto } from './dto/create-candidato.dto';
import { UpdateCandidatoDto } from './dto/update-candidato.dto';
import { CreateCandidatoSkillDto } from './dto/create-candidato-skill.dto';
import { CreateNovaSkillCandidatoDto } from './dto/create-nova-skill.dto';
import { CreateCandidatoFormacaoDto } from './dto/create-candidato-formacao.dto';
import { CreateCandidatoCertificadosDto } from './dto/create-candidato-certificados.dto';
import { CreateNovoCertificadoCandidatoDto } from './dto/create-novo-certificado.dto';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { join, extname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { safeJsonParse } from '../lib/safe-json-parse';

const uploadDir = process.env.UPLOADS_PATH || join(process.cwd(), 'uploads');
if (!existsSync(uploadDir)) {
  mkdirSync(uploadDir, { recursive: true });
}

@Controller('candidato')
export class CandidatoController {
  constructor(
    private readonly candidatoService: CandidatoService,
    private readonly skillService: SkillService,
    private readonly certificacoesService: CertificacoesService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('check-hasperfil/:perfilId')
  checkPerfil(
    @Param('perfilId', ParseIntPipe) perfilId: number,
    @Req() req: Request & { user: JwtPayload },
  ) {
    const usuarioId = req.user?.sub;

    return this.candidatoService.getCheckHasPerfil(usuarioId, perfilId);
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

    return this.candidatoService.getCheckHasPerfilCadastro(
      usuarioId,
      perfilId,
      nomeUser,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('create-candidato')
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
  async createCandidato(
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: Request & { user: JwtPayload },
    @Body() body: CreateCandidatoDto,
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
    const lang = req.user?.lang ?? 'pt';
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
    const formacoes = safeJsonParse<CreateCandidatoFormacaoDto[]>(
      body.formacoes,
    );
    const certificados = safeJsonParse<CreateCandidatoCertificadosDto[]>(
      body.certificacoes,
    );
    const novosCertificados = safeJsonParse<
      CreateNovoCertificadoCandidatoDto[]
    >(body.novas_certificacoes);
    const skills = safeJsonParse<CreateCandidatoSkillDto[]>(body.skills);
    const novasSkills = safeJsonParse<CreateNovaSkillCandidatoDto[]>(
      body.novas_skills,
    );

    // Cria o candidato
    const candidato = await this.candidatoService.createCandidato({
      usuario_id: usuarioId,
      perfil_id: body.perfilId,
      telefone: body.telefone,
      localizacao: body.localizacao,
      apresentacao: body.apresentacao,
      logo: logoFile ? `${BASE_URL}/uploads/${logoFile.filename}` : '',
      meio_notificacao: body.meio_notificacao,
      language: lang,
    });

    // Monta formacoes
    const montaFormacoes =
      formacoes?.map((formacao) => {
        const file = formacaoCertificados.find(
          (f) => f.fieldname === formacao.certificado_field,
        );
        return {
          candidato_id: candidato.id,
          graduacao_id: formacao.graduacao_id,
          formacao: formacao.formacao ?? '',
          certificado_file: file ? `${BASE_URL}/uploads/${file.filename}` : '',
        };
      }) ?? [];

    if (montaFormacoes.length > 0) {
      await this.candidatoService.createCandidatoFormacao(montaFormacoes);
    }

    // certificações já existentes
    const certificacoesExistentes =
      certificados?.map((certificado) => ({
        candidato_id: candidato.id,
        certificacao_id: Number(certificado.certificacao_id),
      })) ?? [];

    // certificações novas
    const certificacoesNovas = await Promise.all(
      (novosCertificados ?? []).map(
        async (novoCertificado: CreateNovoCertificadoCandidatoDto) => {
          const certificado =
            await this.certificacoesService.createOrGetCertificado(
              novoCertificado.certificado,
              lang,
            );
          return {
            candidato_id: candidato.id,
            certificacao_id: Number(certificado.id),
          };
        },
      ),
    );

    // Junta todas as certificações e anexa o arquivo (file) correspondente
    const todasCertificacoes = [
      ...certificacoesExistentes,
      ...certificacoesNovas,
    ].map((certificado, index) => {
      const file = certificacaoCertificados[index]; // pega o arquivo pelo index
      return {
        candidato_id: certificado.candidato_id,
        certificacao_id: certificado.certificacao_id,
        certificado_file: file ? `${BASE_URL}/uploads/${file.filename}` : '',
      };
    });

    // Filtra apenas certificações válidas (ID numérico)
    const todasCertificacoesValidas = todasCertificacoes.filter(
      (c) => typeof c.certificacao_id === 'number' && !isNaN(c.certificacao_id),
    );

    if (todasCertificacoesValidas.length > 0) {
      await this.candidatoService.createCandidatoCertificacoes(
        todasCertificacoesValidas,
      );
    }

    // Skills existentes
    const skillsExistentes =
      skills?.map((skill) => ({
        candidato_id: candidato.id,
        skill_id: skill.skill_id,
        peso: skill.peso,
        favorito: skill.favorito,
        tempo_favorito: skill.tempo_favorito,
      })) ?? [];

    // Skills novas
    const skillsNovas = await Promise.all(
      (novasSkills ?? []).map(async (novaSkill) => {
        const skill = await this.skillService.createOrGetSkill(
          novaSkill.nome,
          lang,
          novaSkill.tipo_skill_id,
        );
        return {
          candidato_id: candidato.id,
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
        candidato_id: number;
        skill_id: number;
        peso: number;
        favorito: boolean;
        tempo_favorito: string;
        nome: string;
      } => typeof skill.skill_id === 'number',
    );

    if (todasSkills.length > 0) {
      await this.candidatoService.createCandidatoSkills(todasSkills);
    }

    // Retorna candidato completo
    const candidatoCompleto = await this.candidatoService.getCandidato(
      candidato.id,
      usuarioId,
      body.perfilId,
      nomeUser,
    );

    return {
      ...candidatoCompleto,
      skills: candidatoCompleto?.skills?.map((s) => ({
        candidato_id: s.candidato_id,
        skill_id: s.skill_id,
        peso: s.peso,
        favorito: s.favorito,
        tempo_favorito: s.tempo_favorito,
        nome: s.nome,
        tipo_skill_id: s.tipo_skill_id,
      })),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('update-candidato')
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
  async updateCandidato(
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: Request & { user: JwtPayload },
    @Body() body: UpdateCandidatoDto, // <-- adicionar perfil_id no body
  ) {
    const usuarioId = req.user?.sub;
    const nomeUser = req.user?.nome;
    const lang = req.user?.lang ?? 'pt';

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
    const formacoes = safeJsonParse<CreateCandidatoFormacaoDto[]>(
      body.formacoes,
    );
    const certificados = safeJsonParse<CreateCandidatoCertificadosDto[]>(
      body.certificacoes,
    );
    const novosCertificados = safeJsonParse<
      CreateNovoCertificadoCandidatoDto[]
    >(body.novas_certificacoes);
    const skills = safeJsonParse<CreateCandidatoSkillDto[]>(body.skills);
    const novasSkills = safeJsonParse<CreateNovaSkillCandidatoDto[]>(
      body.novas_skills,
    );

    const candidatoAtual = await this.candidatoService.getCandidato(
      body.candidatoId,
      usuarioId,
      body.perfilId,
      nomeUser,
    );

    const candidato = await this.candidatoService.updateCandidato({
      candidato_id: body.candidatoId,
      usuario_id: usuarioId,
      perfil_id: body.perfilId,
      telefone: body.telefone,
      localizacao: body.localizacao,
      apresentacao: body.apresentacao,
      logo: logoFile
        ? `${BASE_URL}/uploads/${logoFile.filename}`
        : candidatoAtual?.logo,
      meio_notificacao: body.meio_notificacao,
      ativo: body.ativo,
      language: lang,
    });

    // skills existentes
    const skillsExistentes =
      skills?.map((skill) => ({
        candidato_id: candidato.id,
        skill_id: skill.skill_id,
        peso: skill.peso,
        favorito: skill.favorito,
        tempo_favorito: skill.tempo_favorito,
      })) ?? [];

    // novas skills
    const skillsNovas = await Promise.all(
      (novasSkills ?? []).map(async (novaSkill) => {
        const skill = await this.skillService.createOrGetSkill(
          novaSkill.nome,
          lang,
          novaSkill.tipo_skill_id,
        );

        return {
          candidato_id: candidato.id,
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
        candidato_id: number;
        skill_id: number;
        peso: number;
        favorito: boolean;
        tempo_favorito: string;
      } => typeof skill.skill_id === 'number',
    );

    if (todasSkills.length > 0) {
      await this.candidatoService.updateCandidatoSkills(
        body.candidatoId,
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
          candidato_id: candidato.id,
          graduacao_id: formacao.graduacao_id,
          formacao: formacao.formacao ?? '',
          certificado_file: file ? `${BASE_URL}/uploads/${file.filename}` : '',
        };
      }) ?? [];

    // if (montaFormacoes.length > 0) {
    await this.candidatoService.updateCandidatoFormacao(
      body.candidatoId,
      montaFormacoes,
    );
    // }

    // certificações já existentes
    const certificacoesExistentes =
      certificados?.map((certificado) => ({
        candidato_id: candidato.id,
        certificacao_id: Number(certificado.certificacao_id),
        certificado_field: certificado.certificado_field ?? undefined,
      })) ?? [];

    // certificações novas
    const certificacoesNovas = await Promise.all(
      (novosCertificados ?? [])
        .filter((c) => Number(c.certificacao_id) < 0)
        .map(
          async (
            novoCertificado: CreateNovoCertificadoCandidatoDto & {
              certificado_field?: string;
            },
          ) => {
            const certificado =
              await this.certificacoesService.createOrGetCertificado(
                novoCertificado.certificado,
                lang,
              );

            return {
              candidato_id: candidato.id,
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
          candidato_id: certificado.candidato_id,
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
    await this.candidatoService.updateCandidatoCertificacoes(
      body.candidatoId,
      todasCertificacoesValidas,
    );
    // }

    // ✅ usar perfil_id
    const candidatoCompleto = await this.candidatoService.getCandidato(
      candidato.id,
      usuarioId,
      body.perfilId,
      nomeUser,
    );

    const candidatoComSkillsMapeadas = {
      ...candidatoCompleto,
      skills: candidatoCompleto?.skills?.map((s) => ({
        skill_id: s.skill_id,
        peso: s.peso,
        favorito: s.favorito,
        tempo_favorito: s.tempo_favorito,
        nome: s.nome,
        tipo_skill_id: s.tipo_skill_id,
      })),
    };

    return candidatoComSkillsMapeadas;
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/perfil/:perfilId')
  getCandidato(
    @Param('id', ParseIntPipe) id: number,
    @Param('perfilId', ParseIntPipe) perfilId: number,
    @Req() req: Request & { user: JwtPayload },
  ) {
    const usuarioId = req.user?.sub;
    const nomeUser = req.user?.nome;

    return this.candidatoService.getCandidato(
      id,
      usuarioId,
      perfilId,
      nomeUser,
    );
  }
}
