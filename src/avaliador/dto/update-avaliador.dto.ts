// src/empresa/dto/create-empresa.dto.ts
import {
  IsNotEmpty,
  IsString,
  IsInt,
  IsBoolean,
  IsOptional,
  /* ValidateNested,
  IsArray, */
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
/* import { CreateAvaliadorSkillDto } from './create-avaliador-skill.dto';
import { CreateNovaSkillAvaliadorDto } from './create-nova-skill.dto'; // ← novo import */

export class UpdateAvaliadorDto {
  @Type(() => Number)
  @IsInt()
  avaliadorId!: number;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  empresaId?: number | null;

  @IsNotEmpty()
  @IsString()
  telefone!: string;

  @IsNotEmpty()
  @IsString()
  localizacao!: string;

  @IsString()
  apresentacao!: string;

  @IsNotEmpty()
  @IsString()
  meio_notificacao!: string;

  @Type(() => Number) // transforma string em number
  @IsInt()
  perfilId!: number;

  @Transform(({ value }) => {
    if (typeof value === 'boolean') return value;
    if (value === '1' || value === 1 || value === 'true') return true;
    if (value === '0' || value === 0 || value === 'false' || value === '')
      return false;
    return Boolean(value);
  })
  @IsBoolean()
  avaliar_todos: boolean = false;

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
}
