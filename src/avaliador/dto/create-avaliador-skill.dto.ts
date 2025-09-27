// src/empresa/dto/create-empresa.dto.ts
import { IsInt, IsBoolean, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAvaliadorSkillDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  skill_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  avaliador_id?: number;

  @Type(() => Number) // transforma string em number
  @IsInt()
  peso!: number;

  @IsBoolean()
  favorito: boolean = false;

  @IsOptional()
  @IsString()
  tempo_favorito?: string;

  @IsOptional()
  @IsString()
  nome?: string;
}
