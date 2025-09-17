import { Type, Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsUrl,
  IsInt,
  IsBoolean,
} from 'class-validator';

export class UpdateEmpresaDto {
  @Type(() => Number)
  @IsInt()
  empresa_id!: number;

  @Type(() => Number)
  @IsInt()
  perfilId!: number;

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

  @IsNotEmpty()
  @IsString()
  localizacao!: string;

  @IsNotEmpty()
  @IsString()
  apresentacao!: string;

  @Transform(({ value }) => value === 'true' || value === '1')
  @IsBoolean()
  ativo: boolean = true;
}
