import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TipoConviteRecrutador } from '@prisma/client';

export class CriarConviteManualDto {
  @IsEnum(TipoConviteRecrutador)
  tipo!: TipoConviteRecrutador;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  titulo!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1500)
  mensagem!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @Type(() => Number)
  @IsInt({ each: true })
  candidato_ids!: number[];
}
