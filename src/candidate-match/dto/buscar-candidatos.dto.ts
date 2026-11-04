import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsIn,
  Max,
  Min,
  ValidateIf,
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

  // null ou ausente = sem filtro de distância
  @IsOptional()
  @IsIn([50, 85, 100, 120])
  @Type(() => Number)
  raio_km?: number | null;

  // Obrigatória quando houver raio
  @ValidateIf((dto: BuscarCandidatosDto) => dto.raio_km != null)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  cidade_id?: number | null;
}
