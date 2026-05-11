import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UploadedFiles,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  FileInterceptor,
  FilesInterceptor,
} from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { MulterExceptionFilter } from '../../common/filters/multer-exception.filter';
import { MultimediaService } from './multimedia.service';

@Controller('multimedia')
@UseGuards(JwtAuthGuard)
@UseFilters(MulterExceptionFilter)
export class MultimediaController {
  constructor(private readonly multimediaService: MultimediaService) {}

  @Post('upload-image')
  @UseInterceptors(
    FilesInterceptor('images', 10, {
      storage: memoryStorage(),
      limits: {
        fileSize: 25 * 1024 * 1024, // límite superior, se valida por tipo en servicio
      },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype?.startsWith('image/')) {
          return cb(new BadRequestException('MIME inválido (solo imágenes)') as any, false);
        }
        return cb(null, true);
      },
    }),
  )
  uploadImages(@UploadedFiles() files: Express.Multer.File[]) {
    return this.multimediaService.uploadImages(files);
  }

  @Post('upload-audio')
  @UseInterceptors(
    FileInterceptor('audio', {
      storage: memoryStorage(),
      limits: {
        fileSize: 25 * 1024 * 1024,
      },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype?.startsWith('audio/')) {
          return cb(new BadRequestException('MIME inválido (solo audio)') as any, false);
        }
        return cb(null, true);
      },
    }),
  )
  uploadAudio(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Debes enviar un archivo de audio');
    }
    return this.multimediaService.uploadAudio(file);
  }
}
