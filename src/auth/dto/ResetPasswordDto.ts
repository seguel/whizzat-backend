import { IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  token!: string;

  @IsString()
  @MinLength(8, { message: 'validation.senha_tamanho_min' })
  @MaxLength(16, { message: 'validation.senha_tamanho_max' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,16}$/, {
    message: 'validation.senha_tamanho',
  })
  novaSenha!: string;
}
