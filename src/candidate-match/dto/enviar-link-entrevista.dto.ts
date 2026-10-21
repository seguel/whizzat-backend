import { PlataformaEntrevista } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  ValidateIf,
} from 'class-validator';

export class EnviarLinkEntrevistaDto {
  @IsEnum(PlataformaEntrevista)
  plataforma!: PlataformaEntrevista;

  @IsOptional()
  @IsBoolean()
  gerar_automaticamente?: boolean;

  @ValidateIf((dto) => dto.gerar_automaticamente !== true)
  @IsString()
  @IsUrl({
    require_protocol: true,
    protocols: ['http', 'https'],
  })
  link_reuniao?: string;
}
