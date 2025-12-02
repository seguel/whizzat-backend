import {
  IsString,
  IsEmail,
  IsBoolean,
  IsDate,
  MinLength,
  MaxLength,
  Matches,
  IsOptional,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RegisterDto {
  @IsString()
  primeiro_nome!: string;

  @IsString()
  ultimo_nome!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8, { message: 'validation.senha_tamanho_min' })
  @MaxLength(16, { message: 'validation.senha_tamanho_max' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,16}$/, {
    message: 'validation.senha_tamanho',
  })
  senha!: string;

  @IsBoolean()
  ativo: boolean = false;

  @IsDate()
  @Type(() => Date) // Necessário para converter string em Date com class-transformer
  createdAt: Date = new Date();

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
