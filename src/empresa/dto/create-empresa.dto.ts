// src/empresa/dto/create-empresa.dto.ts
import { IsEmail, IsNotEmpty, IsString, IsUrl, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateEmpresaDto {
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
  /* 
  @IsNotEmpty()
  @IsString()
  logo!: string; // Base64 ou URL se for CDN

  @IsNotEmpty()
  @IsString()
  imagem_fundo!: string; // Base64 ou URL se for CDN */

  @Type(() => Number) // transforma string em number
  @IsInt()
  perfilId!: number;
}
