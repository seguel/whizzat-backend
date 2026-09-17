import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CriarConviteVagaDto {
  @Type(() => Number)
  @IsInt()
  empresa_id!: number;

  @Type(() => Number)
  @IsInt()
  vaga_id!: number;

  @IsArray()
  @ArrayNotEmpty()
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
}
