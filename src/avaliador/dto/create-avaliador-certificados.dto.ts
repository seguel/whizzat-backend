// src/empresa/dto/create-empresa.dto.ts
import { IsInt, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAvaliadorCertificadosDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  certificacao_id?: number;

  @Type(() => Number)
  @IsInt()
  avaliador_id?: number;
}
