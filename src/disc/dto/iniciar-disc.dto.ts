import { IsBoolean, Equals } from 'class-validator';

export class IniciarDiscDto {
  @IsBoolean()
  @Equals(true, {
    message: 'É necessário aceitar a participação no DISC.',
  })
  consentimento!: boolean;
}
