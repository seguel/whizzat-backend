import { IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class SendQuestionarioDto {
  @Type(() => Number) // transforma string em number
  @IsInt()
  avaliacao_id!: number;

  @Type(() => Number) // transforma string em number
  @IsInt()
  questionario_id?: number; // opcional
}
