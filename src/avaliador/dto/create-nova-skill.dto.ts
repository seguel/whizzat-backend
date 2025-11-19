// src/avaliador/dto/create-nova-skill.dto.ts
import {
  IsNotEmpty,
  IsString,
  IsInt,
  IsBoolean,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateNovaSkillAvaliadorDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  skill_id?: number;

  @IsNotEmpty({ message: 'O nome da skill é obrigatório' })
  @IsString()
  nome!: string;

  @Type(() => Number)
  @IsInt()
  peso!: number;

  @IsBoolean()
  favorito: boolean = false;

  @IsOptional()
  @IsString()
  tempo_favorito!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  tipo_skill_id!: number;
}
