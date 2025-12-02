// src/candidato/dto/create-candidato.dto.ts
import {
  IsNotEmpty,
  IsString,
  IsInt,
  IsOptional,
  IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';

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
}
