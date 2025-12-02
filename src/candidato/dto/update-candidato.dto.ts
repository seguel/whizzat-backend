// src/empresa/dto/create-empresa.dto.ts
import {
  IsNotEmpty,
  IsString,
  IsInt,
  IsBoolean,
  IsOptional,
  IsDate,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

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

  @Type(() => Number) // transforma string em number
  @IsInt()
  perfilId!: number;

  @IsOptional()
  @IsString()
  skills?: string;

  @IsOptional()
  @IsString()
  novas_skills?: string;

  @Transform(({ value }) => {
    if (typeof value === 'boolean') return value;
    if (value === '1' || value === 1 || value === 'true') return true;
    if (value === '0' || value === 0 || value === 'false' || value === '')
      return false;
    return Boolean(value);
  })
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
}
