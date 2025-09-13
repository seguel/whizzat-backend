// src/empresa/dto/update-empresa.dto.ts
import { Type } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, IsUrl, IsInt } from 'class-validator';

export class UpdateEmpresaDto {
  @Type(() => Number)
  @IsInt()
  empresa_id!: number;

  @Type(() => Number) // transforma string em number
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
}
