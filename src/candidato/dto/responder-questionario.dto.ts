import { Type } from 'class-transformer';
import { IsArray, IsInt, IsString, ValidateNested } from 'class-validator';

export class RespostaQuestionarioDto {
  @IsInt()
  perguntaId!: number;

  @IsString()
  resposta!: string;
}

export class ResponderQuestionarioDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RespostaQuestionarioDto)
  respostas!: RespostaQuestionarioDto[];
}
