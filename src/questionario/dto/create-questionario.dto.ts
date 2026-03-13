import {
  IsString,
  IsBoolean,
  IsOptional,
  IsArray,
  ValidateNested,
  IsInt,
} from 'class-validator';

import { Type } from 'class-transformer';

class PerguntaDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id?: number;

  @IsString()
  pergunta!: string;

  @IsOptional()
  @IsString()
  resposta_base?: string | null;

  @IsString()
  tipo_pergunta!: string;

  @IsBoolean()
  ativo!: boolean;

  @IsInt()
  ordem!: number;
}

export class CreateQuestionarioDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id?: number;

  @IsString()
  titulo!: string;

  @IsOptional()
  @IsString()
  comentario?: string;

  @IsBoolean()
  ativo!: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PerguntaDto)
  perguntas!: PerguntaDto[];
}
