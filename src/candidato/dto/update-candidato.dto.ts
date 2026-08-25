// src/candidato/dto/update-candidato.dto.ts

import {
  IsNotEmpty,
  IsString,
  IsInt,
  IsBoolean,
  IsOptional,
  IsDate,
} from 'class-validator';

import { Transform, Type } from 'class-transformer';

const booleanTransform = ({ value }: { value: unknown }) => {
  if (typeof value === 'boolean') return value;

  if (value === '1' || value === 1 || value === 'true') return true;

  if (value === '0' || value === 0 || value === 'false' || value === '') {
    return false;
  }

  return Boolean(value);
};

export class UpdateCandidatoDto {
  @Type(() => Number)
  @IsInt()
  candidatoId!: number;

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

  @Type(() => Number)
  @IsInt()
  perfilId!: number;

  @IsOptional()
  @IsString()
  skills?: string;

  @IsOptional()
  @IsString()
  novas_skills?: string;

  @Transform(booleanTransform)
  @IsBoolean()
  ativo: boolean = true;

  @IsOptional()
  @IsString()
  formacoes?: string;

  @IsOptional()
  @IsString()
  certificacoes?: string;

  @IsOptional()
  @IsString()
  novas_certificacoes?: string;

  @IsString()
  primeiro_nome!: string;

  @IsString()
  ultimo_nome!: string;

  @IsDate()
  @Type(() => Date)
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

  // =====================================================
  // OPORTUNIDADES
  // =====================================================

  @Transform(booleanTransform)
  @IsBoolean()
  aberto_oportunidades: boolean = true;

  @Transform(booleanTransform)
  @IsBoolean()
  oportunidade_pcd: boolean = false;

  @Transform(booleanTransform)
  @IsBoolean()
  oportunidade_afirmativa_racial: boolean = false;

  @Transform(booleanTransform)
  @IsBoolean()
  oportunidade_lgbtqia: boolean = false;

  @Transform(booleanTransform)
  @IsBoolean()
  oportunidade_50mais: boolean = false;

  @Transform(booleanTransform)
  @IsBoolean()
  oportunidade_diversidade: boolean = false;
}
