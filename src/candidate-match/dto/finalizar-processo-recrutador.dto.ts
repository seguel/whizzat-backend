import { IsBoolean, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class FinalizarProcessoRecrutadorDto {
  @IsBoolean()
  aprovado!: boolean;

  @IsString()
  @IsNotEmpty()
  @MaxLength(3000)
  parecer!: string;
}
