import {
  IsString,
  IsEmail,
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
  @MinLength(8)
  @MaxLength(16)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,16}$/)
  senha!: string;

  @IsDate()
  @Type(() => Date)
  data_nascimento!: Date;

  @IsOptional()
  @IsString()
  nome_social?: string | null;

  @IsInt()
  @Type(() => Number)
  genero_id!: number;

  @IsInt()
  @Type(() => Number)
  cidade_id!: number;

  @IsString()
  linguagem!: string;
}
