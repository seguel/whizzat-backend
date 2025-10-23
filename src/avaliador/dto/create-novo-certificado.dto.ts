import { IsNotEmpty, IsString, IsInt, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateNovoCertificadoAvaliadorDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  certificacao_id?: number;

  @IsNotEmpty({ message: 'O nome do Certificado é obrigatório' })
  @IsString()
  certificado!: string;
}
