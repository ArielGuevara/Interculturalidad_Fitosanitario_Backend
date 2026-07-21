import { Module } from '@nestjs/common';
import { PlagasService } from './plagas.service';
import { PlagasController } from './plagas.controller';
import { PlagasRepository } from './plagas.repository';

@Module({
  controllers: [PlagasController],
  providers: [PlagasService, PlagasRepository],
  exports: [PlagasService],
})
export class PlagasModule {}
