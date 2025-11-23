import { IsNotEmpty, IsString, IsInt, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateNovoCertificadoCandidatoDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  certificacao_id?: number;

  @IsNotEmpty({ message: 'O nome do Certificado é obrigatório' })
  @IsString()
  certificado!: string;

  @IsOptional()
  @IsString()
  certificado_file?: string;

  @IsOptional() // ✅ novo campo
  @IsString()
  certificado_field?: string; // fieldname enviado do front
}
