import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  Req,
  Res,
  UploadedFile,
  UploadedFiles,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Request, Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { MulterExceptionFilter } from '../../common/filters/multer-exception.filter';
import { MultimediaService } from './multimedia.service';
import { StorageService } from '../storage/storage.service';

@Controller('multimedia')
@UseFilters(MulterExceptionFilter)
export class MultimediaController {
  constructor(
    private readonly multimediaService: MultimediaService,
    private readonly storageService: StorageService,
  ) {}

  @Get('*objectKey')
  async serveImage(@Req() req: Request, @Res() res: Response) {
    const raw = req.params.objectKey;
    const objectKey = Array.isArray(raw) ? raw.join('/') : raw;
    try {
      const { stream, contentType } = await this.storageService.getObjectStream(objectKey);
      if (contentType) {
        res.setHeader('Content-Type', contentType);
      }
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      stream.pipe(res);
    } catch {
      res.status(404).json({ message: 'Imagen no encontrada' });
    }
  }

  @Post('upload-image')
  @UseInterceptors(
    FilesInterceptor('images', 10, {
      storage: memoryStorage(),
      limits: {
        fileSize: 25 * 1024 * 1024, // límite superior, se valida por tipo en servicio
      },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype?.startsWith('image/')) {
          return cb(
            new BadRequestException('MIME inválido (solo imágenes)'),
            false,
          );
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
          return cb(
            new BadRequestException('MIME inválido (solo audio)'),
            false,
          );
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
