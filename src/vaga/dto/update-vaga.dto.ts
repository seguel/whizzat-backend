// src/empresa/dto/create-empresa.dto.ts
import {
  IsNotEmpty,
  IsString,
  IsInt,
  IsBoolean,
  ValidateNested,
  IsArray,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateVagaSkillDto } from './create-vaga-skill.dto';
import { CreateNovaSkillDto } from './create-nova-skill.dto'; // ← novo import

export class UpdateVagaDto {
  @Type(() => Number)
  @IsInt()
  empresa_id!: number;

  @Type(() => Number)
  @IsInt()
  vaga_id!: number;

  @IsNotEmpty({ message: 'O nome da vaga é obrigatório' })
  @IsString()
  nome_vaga!: string;

  @IsNotEmpty({ message: 'A descrição da vaga é obrigatório' })
  @IsString()
  descricao!: string;

  @IsOptional()
  @IsString()
  local_vaga!: string;

  @Type(() => Number)
  @IsInt()
  modalidade_trabalho_id!: number;

  @Type(() => Number)
  @IsInt()
  periodo_trabalho_id!: number;

  @IsBoolean()
  pcd: boolean = false;

  @IsBoolean()
  lgbtq: boolean = false;

  @IsBoolean()
  mulheres: boolean = false;

  @IsBoolean()
  cinquenta_mais: boolean = false;

  @Type(() => Number)
  @IsInt()
  qtde_dias_aberta!: number;

  @Type(() => Number)
  @IsInt()
  qtde_posicao!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVagaSkillDto)
  skills!: CreateVagaSkillDto[];

  // 👇 novas skills digitadas pelo usuário
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateNovaSkillDto)
  novas_skills?: CreateNovaSkillDto[];

  @IsBoolean()
  ativo: boolean = true;

  @Type(() => Number)
  @IsInt()
  cidade_id!: number;
}
