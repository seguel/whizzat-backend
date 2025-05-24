import { IsString, IsEmail, IsBoolean, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class RegisterDto {
  @IsString()
  primeiro_nome!: string;

  @IsString()
  ultimo_nome!: string;

  @IsEmail()
  email!: string;

  @IsString()
  senha!: string;

  @IsBoolean()
  ativo: boolean = false;

  @IsDate()
  @Type(() => Date) // Necessário para converter string em Date com class-transformer
  createdAt: Date = new Date();
}
