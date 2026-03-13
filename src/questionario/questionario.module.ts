import { Module } from '@nestjs/common';
import { QuestionarioController } from './questionario.controller';
import { QuestionarioService } from './questionario.service';

@Module({
  controllers: [QuestionarioController],
  providers: [QuestionarioService],
})
export class QuestionarioModule {}
