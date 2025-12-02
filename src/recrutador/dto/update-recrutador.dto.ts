import { Type, Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  IsInt,
  IsBoolean,
  IsDate,
  IsOptional,
} from 'class-validator';

export class UpdateRecrutadorDto {
  @Type(() => Number)
  @IsInt()
  recrutadorId!: number;

  @IsNotEmpty()
  @IsString()
  telefone!: string;

  @IsOptional()
  @IsString()
  localizacao?: string;

  @IsString()
  apresentacao!: string;

  @IsNotEmpty()
  @IsString()
  meio_notificacao!: string;

  @Transform(({ value }) => value === 'true' || value === '1')
  @IsBoolean()
  ativo: boolean = true;

  @IsString()
  primeiro_nome!: string;

  @IsString()
  ultimo_nome!: string;

  @IsDate()
  @Type(() => Date) // Necessário para converter string em Date com class-transformer
  data_nascimento: Date = new Date();

  @IsOptional()
  @IsString()
  nome_social?: string;

  @Type(() => Number)
  @IsInt()
  genero_id!: number;

  @Type(() => Number)
  @IsInt()
  cidade_id!: number;
}
