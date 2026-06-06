import { IsString } from 'class-validator';

export class SalvarComentarioRespostaDto {
  @IsString()
  comentario!: string; // opcional
}
