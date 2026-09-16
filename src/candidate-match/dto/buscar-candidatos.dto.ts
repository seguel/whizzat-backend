import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsInt,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

import { FaixaMatch } from './buscar-candidatos-vaga.dto';

export class BuscarCandidatoSkillDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  skill_id!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  peso!: number;
}

export class BuscarCandidatosDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => BuscarCandidatoSkillDto)
  skills!: BuscarCandidatoSkillDto[];

  @IsEnum(FaixaMatch)
  faixa!: FaixaMatch;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(25)
  limite!: number;
}
