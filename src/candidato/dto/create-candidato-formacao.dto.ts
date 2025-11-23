import { IsInt, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCandidatoFormacaoDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  candidato_id?: number;

  @Type(() => Number)
  @IsInt()
  graduacao_id!: number;

  @IsString()
  formacao?: string;

  @IsOptional()
  @IsString()
  certificado_file?: string;

  @IsOptional() // ✅ novo campo
  @IsString()
  certificado_field?: string; // fieldname enviado do front
}
