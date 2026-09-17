import { IsEnum } from 'class-validator';

export enum RespostaAgendaCandidato {
  ACEITAR = 'ACEITAR',
  RECUSAR = 'RECUSAR',
}

export class ResponderAgendaCandidatoDto {
  @IsEnum(RespostaAgendaCandidato)
  resposta!: RespostaAgendaCandidato;
}
