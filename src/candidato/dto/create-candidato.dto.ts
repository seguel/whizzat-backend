// src/candidato/dto/create-candidato.dto.ts
import {
  IsNotEmpty,
  IsString,
  IsInt,
  IsOptional,
  IsDate,
  IsBoolean,
} from 'class-validator';

import { Transform, Type } from 'class-transformer';

const ToBoolean = () =>
  Transform(({ value }) => {
    if (typeof value === 'boolean') return value;

    return value === true || value === 'true' || value === '1' || value === 1;
  });

export class CreateCandidatoDto {
  @IsNotEmpty()
  @IsString()
  telefone!: string;

  @IsOptional()
  @IsString()
  localizacao?: string;

  @IsString()
  apresentacao!: string;

  @IsNotEmpty()
  @IsString()
  meio_notificacao!: string;

  @Type(() => Number) // transforma string em number
  @IsInt()
  perfilId!: number;

  @IsOptional()
  @IsString()
  formacoes?: string;

  @IsOptional()
  @IsString()
  certificacoes?: string;

  @IsOptional()
  @IsString()
  novas_certificacoes?: string;

  @IsOptional()
  @IsString()
  skills?: string;

  @IsOptional()
  @IsString()
  novas_skills?: string;

  @IsString()
  primeiro_nome!: string;

  @IsString()
  ultimo_nome!: string;

  @IsDate()
  @Type(() => Date) // Necessário para converter string em Date com class-transformer
  data_nascimento: Date = new Date();

  @IsOptional()
  @IsString()
  nome_social?: string;

  @Type(() => Number)
  @IsInt()
  genero_id!: number;

  @Type(() => Number)
  @IsInt()
  cidade_id!: number;

  @IsOptional()
  @IsBoolean()
  @ToBoolean()
  aberto_oportunidades?: boolean;

  @IsOptional()
  @IsBoolean()
  @ToBoolean()
  oportunidade_pcd?: boolean;

  @IsOptional()
  @IsBoolean()
  @ToBoolean()
  oportunidade_afirmativa_racial?: boolean;

  @IsOptional()
  @IsBoolean()
  @ToBoolean()
  oportunidade_lgbtqia?: boolean;

  @IsOptional()
  @IsBoolean()
  @ToBoolean()
  oportunidade_50mais?: boolean;

  @IsOptional()
  @IsBoolean()
  @ToBoolean()
  oportunidade_diversidade?: boolean;

  @IsOptional()
  @IsString()
  modalidades_trabalho?: string;
}
