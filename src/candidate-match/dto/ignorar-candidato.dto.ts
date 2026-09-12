import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class IgnorarCandidatoDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  candidato_id!: number;

  @IsOptional()
  @IsString()
  @IsIn(['PERFIL_NAO_ADERENTE', 'HISTORICO_ENTREVISTA', 'JA_AVALIADO', 'OUTRO'])
  motivo?: string;
}
