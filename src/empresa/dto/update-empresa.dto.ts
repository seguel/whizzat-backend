import { Type, Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsUrl,
  IsInt,
  IsBoolean,
  IsOptional,
} from 'class-validator';

export class UpdateEmpresaDto {
  @Type(() => Number)
  @IsInt()
  empresa_id!: number;

  @Type(() => Number)
  @IsInt()
  recrutadorId!: number;

  @IsNotEmpty()
  @IsString()
  nome!: string;

  @IsNotEmpty()
  @IsUrl()
  site!: string;

  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @IsNotEmpty()
  @IsString()
  telefone!: string;

  @IsOptional()
  @IsString()
  localizacao?: string;

  @IsNotEmpty()
  @IsString()
  apresentacao!: string;

  @Type(() => Number) // transforma string em number
  @IsInt()
  perfilId!: number;

  @Transform(({ value }) => value === 'true' || value === '1')
  @IsBoolean()
  ativo: boolean = true;

  @Type(() => Number)
  @IsInt()
  cidade_id!: number;
}
