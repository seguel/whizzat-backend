import { IsBoolean } from 'class-validator';

export class AtualizarCompartilhamentoDiscDto {
  @IsBoolean()
  compartilhar_recrutador!: boolean;
}
