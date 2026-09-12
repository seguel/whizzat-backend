import { Module } from '@nestjs/common';
import { CandidateMatchController } from './candidate-match.controller';
import { CandidateMatchService } from './candidate-match.service';

@Module({
  controllers: [CandidateMatchController],
  providers: [CandidateMatchService],
  exports: [CandidateMatchService],
})
export class CandidateMatchModule {}
