import { Module } from '@nestjs/common';
import { DiscController } from './disc.controller';
import { DiscService } from './disc.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DiscController],
  providers: [DiscService],
  exports: [DiscService],
})
export class DiscModule {}
