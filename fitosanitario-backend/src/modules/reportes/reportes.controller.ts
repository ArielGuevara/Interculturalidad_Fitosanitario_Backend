import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UploadedFiles,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { memoryStorage }         from 'multer';
import { JwtAuthGuard }          from '../../common/guards/jwt-auth.guard';
import { RolesGuard }            from '../../common/guards/roles.guard';
import { Roles }                 from '../../common/decorators/roles.decorator';
import { CurrentUser }           from '../../common/decorators/current-user.decorator';
import { MulterExceptionFilter } from '../../common/filters/multer-exception.filter';
import { CreateReporteDto }      from './dto/create-reporte.dto';
import { CambiarEstadoDto }      from './dto/cambiar-estado.dto';
import { ReportesService }       from './reportes.service';

@Controller('reportes')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseFilters(MulterExceptionFilter)
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  // Agricultor ve los suyos, Moderador ve todos
  @Get()
  findAll(@CurrentUser() user: { id: number; rol: string }) {
    if (user.rol === 'MODERADOR') {
      return this.reportesService.findAll();
    }
    return this.reportesService.findByUsuario(user.id);
  }

  // Bandeja del moderador — solo PENDIENTES (RF-08)
  @Get('pendientes')
  @Roles('MODERADOR')
  findPendientes() {
    return this.reportesService.findPendientes();
  }

  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.reportesService.findById(id);
  }

  @Get(':id/historial')
  getHistorial(@Param('id', ParseIntPipe) id: number) {
    return this.reportesService.getHistorial(id);
  }

  // Crear reporte con fotos y audio en una sola petición
  @Post()
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'images', maxCount: 10 },
        { name: 'audio',  maxCount: 1  },
      ],
      {
        storage: memoryStorage(),
        limits: { fileSize: 25 * 1024 * 1024, files: 11 },
        fileFilter: (_req, file, cb) => {
          const ok =
            (file.fieldname === 'images' && file.mimetype?.startsWith('image/')) ||
            (file.fieldname === 'audio'  && file.mimetype?.startsWith('audio/'));
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
    @UploadedFiles() files: { images?: Express.Multer.File[]; audio?: Express.Multer.File[] },
  ) {
    return this.reportesService.create({
      dto,
      usuarioId: user.id,
      images:    files?.images ?? [],
      audio:     files?.audio?.[0],
    });
  }

  // Sincronización offline — acepta un array de reportes
  @Post('sync')
  bulkSync(
    @CurrentUser() user: { id: number },
    @Body() reportes: any[],
  ) {
    return this.reportesService.bulkSync(user.id, reportes);
  }

  // Cambiar estado — solo MODERADOR (RF-09)
  @Patch(':id/estado')
  @Roles('MODERADOR')
  cambiarEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CambiarEstadoDto,
    @CurrentUser() user: { id: number },
  ) {
    return this.reportesService.cambiarEstado({
      reporteId:   id,
      usuarioId:   user.id,
      estadoNuevo: dto.estado,
      motivo:      dto.motivo,
    });
  }
}