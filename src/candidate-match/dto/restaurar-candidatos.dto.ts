// src/candidate-match/dto/restaurar-candidatos.dto.ts

import { ArrayNotEmpty, IsArray, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class RestaurarCandidatosDto {
  @IsArray()
  @ArrayNotEmpty()
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(1, { each: true })
  candidato_ids!: number[];
}
