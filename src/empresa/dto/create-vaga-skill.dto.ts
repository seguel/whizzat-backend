// src/empresa/dto/create-empresa.dto.ts
import { IsInt, IsBoolean, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateVagaSkillDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  skill_id?: number;

  @IsBoolean()
  avaliador_proprio: boolean = false;

  @Type(() => Number) // transforma string em number
  @IsInt()
  peso!: number;

  @IsOptional()
  @IsString()
  nome?: string;
}
