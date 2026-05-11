import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UploadedFiles,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { MulterExceptionFilter } from '../../common/filters/multer-exception.filter';
import { CreateReporteDto } from './dto/create-reporte.dto';
import { ReportesService } from './reportes.service';

@Controller('reportes')
@UseGuards(JwtAuthGuard)
@UseFilters(MulterExceptionFilter)
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  @Post()
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'images', maxCount: 10 },
        { name: 'audio', maxCount: 1 },
      ],
      {
        storage: memoryStorage(),
        limits: {
          fileSize: 25 * 1024 * 1024,
          files: 11,
        },
        fileFilter: (_req, file, cb) => {
          const ok =
            (file.fieldname === 'images' && file.mimetype?.startsWith('image/')) ||
            (file.fieldname === 'audio' && file.mimetype?.startsWith('audio/'));
          if (!ok) {
            return cb(new BadRequestException('MIME inválido para el campo') as any, false);
          }
          return cb(null, true);
        },
      },
    ),
  )
  create(
    @CurrentUser() user: { id: number },
    @Body() dto: CreateReporteDto,
    @UploadedFiles()
    files: { images?: Express.Multer.File[]; audio?: Express.Multer.File[] },
  ) {
    const audioFile = files?.audio?.[0];

    return this.reportesService.create({
      dto,
      usuarioId: user.id,
      images: files?.images ?? [],
      audio: audioFile,
    });
  }

  @Get()
  findAll() {
    return this.reportesService.findAll();
  }

  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.reportesService.findById(id);
  }
}
