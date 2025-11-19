// src/empresa/dto/create-nova-skill.dto.ts
import {
  IsNotEmpty,
  IsString,
  IsInt,
  IsBoolean,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateNovaSkillDto {
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
  avaliador_proprio: boolean = false;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  tipo_skill_id!: number;
}
