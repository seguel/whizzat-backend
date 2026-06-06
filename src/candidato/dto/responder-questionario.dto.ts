import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class RespostaQuestionarioDto {
  @IsInt()
  perguntaId!: number;

  @IsString()
  @IsOptional()
  resposta?: string;
}

export class ResponderQuestionarioDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RespostaQuestionarioDto)
  respostas!: RespostaQuestionarioDto[];
}
