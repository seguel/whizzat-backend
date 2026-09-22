import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

import { Type } from 'class-transformer';

export class CompatibilidadeCandidatoDto {
  @Type(() => Number)
  @IsInt()
  candidato_id!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  score!: number;
}

export class CriarConviteVagaDto {
  @Type(() => Number)
  @IsInt()
  empresa_id!: number;

  @Type(() => Number)
  @IsInt()
  vaga_id!: number;

  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(10)
  @Type(() => Number)
  @IsInt({ each: true })
  candidato_ids!: number[];

  @IsOptional()
  @IsString()
  @MaxLength(120)
  titulo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1500)
  mensagem?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => CompatibilidadeCandidatoDto)
  compatibilidades!: CompatibilidadeCandidatoDto[];
}
