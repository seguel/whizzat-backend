import { IsDateString } from 'class-validator';

export class SugerirAgendaRecrutadorDto {
  @IsDateString()
  data_hora_agenda!: string;
}
