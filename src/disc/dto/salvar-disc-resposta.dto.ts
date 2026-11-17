import { Type } from 'class-transformer';
import { IsInt, Min, Max } from 'class-validator';

export class SalvarDiscRespostaDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pergunta_id!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  alternativa_mais_id!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  alternativa_menos_id!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(3600000)
  tempo_ms!: number;
}
