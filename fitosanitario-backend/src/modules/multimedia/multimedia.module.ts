import { Module } from '@nestjs/common';
import { MultimediaController } from './multimedia.controller';
import { MultimediaService } from './multimedia.service';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [StorageModule],
  controllers: [MultimediaController],
  providers: [MultimediaService],
  exports: [MultimediaService],
})
export class MultimediaModule {}
