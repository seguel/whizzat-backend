import {
  IsString,
  IsEmail,
  IsBoolean,
  IsDate,
  MinLength,
  MaxLength,
  Matches,
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
}
