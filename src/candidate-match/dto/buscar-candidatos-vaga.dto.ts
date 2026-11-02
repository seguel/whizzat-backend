import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsBoolean,
  Min,
} from 'class-validator';

import { Transform, Type } from 'class-transformer';

export enum FaixaMatch {
  ALTA = 'ALTA',
  BOA = 'BOA',
  COMPATIVEL = 'COMPATIVEL',
  TODOS = 'TODOS',
}

export class BuscarCandidatosVagaDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  empresa_id!: number;

  @Type(() => Number)
  @IsInt()
  @IsIn([10, 15, 25])
  limite!: number;

  @IsEnum(FaixaMatch)
  faixa!: FaixaMatch;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn([50, 85, 100, 120])
  raio_km?: number;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === true || value === 'true') return true;
    if (value === false || value === 'false') return false;
    return value;
  })
  incluir_fora_raio?: boolean;
}
