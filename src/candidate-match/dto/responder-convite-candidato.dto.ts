import { IsEnum } from 'class-validator';

export enum RespostaConviteCandidato {
  ACEITAR = 'ACEITAR',
  RECUSAR = 'RECUSAR',
}

export class ResponderConviteCandidatoDto {
  @IsEnum(RespostaConviteCandidato)
  resposta!: RespostaConviteCandidato;
}
