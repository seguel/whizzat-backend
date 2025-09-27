import { Type, Transform } from 'class-transformer';
import { IsNotEmpty, IsString, IsInt, IsBoolean } from 'class-validator';

export class UpdateRecrutadorDto {
  @Type(() => Number)
  @IsInt()
  recrutadorId!: number;

  @IsNotEmpty()
  @IsString()
  telefone!: string;

  @IsNotEmpty()
  @IsString()
  localizacao!: string;

  @IsString()
  apresentacao!: string;

  @IsNotEmpty()
  @IsString()
  meio_notificacao!: string;

  @Transform(({ value }) => value === 'true' || value === '1')
  @IsBoolean()
  ativo: boolean = true;
}
