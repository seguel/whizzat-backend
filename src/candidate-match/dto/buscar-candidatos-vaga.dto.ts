import { IsEnum, IsIn, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

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
}
