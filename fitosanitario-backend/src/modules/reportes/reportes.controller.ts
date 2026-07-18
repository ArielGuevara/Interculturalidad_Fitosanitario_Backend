import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UploadedFile,
  UploadedFiles,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { SuspensionGuard } from '../../common/guards/suspension.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { MulterExceptionFilter } from '../../common/filters/multer-exception.filter';
import { CreateReporteDto } from './dto/create-reporte.dto';
import { CambiarEstadoDto } from './dto/cambiar-estado.dto';
import { VolverAReportarDto } from './dto/volver-a-reportar.dto';
import { SuspenderUsuarioDto } from './dto/suspender-usuario.dto';
import { ReEditarReporteDto } from './dto/re-editar-reporte.dto';
import { BulkSyncInputDto } from './dto/bulk-sync-reporte.dto';
import { ReportesService } from './reportes.service';

@Controller('reportes')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseFilters(MulterExceptionFilter)
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  @Get()
  findAll(@CurrentUser() user: { id: number; rol: string }) {
    if (user.rol === 'MODERADOR') {
      return this.reportesService.findAll();
    }
    return this.reportesService.findByUsuario(user.id);
  }

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

  @Get('suspension/activa')
  getSuspensionActiva(@CurrentUser() user: { id: number }) {
    return this.reportesService.getSuspensionActiva(user.id);
  }

  @Post()
  @UseGuards(SuspensionGuard)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'images', maxCount: 10 },
        { name: 'audio', maxCount: 1 },
      ],
      {
        storage: memoryStorage(),
        limits: { fileSize: 25 * 1024 * 1024, files: 11 },
        fileFilter: (_req, file, cb) => {
          const ok =
            (file.fieldname === 'images' &&
              file.mimetype?.startsWith('image/')) ||
            (file.fieldname === 'audio' && file.mimetype?.startsWith('audio/'));
          if (!ok) {
            return cb(
              new BadRequestException('MIME inválido para el campo'),
              false,
            );
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
    return this.reportesService.create({
      dto,
      usuarioId: user.id,
      images: files?.images ?? [],
      audio: files?.audio?.[0],
    });
  }

  @Post('sync')
  bulkSync(@CurrentUser() user: { id: number }, @Body() dto: BulkSyncInputDto) {
    return this.reportesService.bulkSync(user.id, dto.reportes);
  }

  @Patch(':id/estado')
  @Roles('MODERADOR')
  cambiarEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CambiarEstadoDto,
    @CurrentUser() user: { id: number },
  ) {
    return this.reportesService.cambiarEstado({
      reporteId: id,
      usuarioId: user.id,
      estadoNuevo: dto.estado,
      motivo: dto.motivo,
    });
  }

  @Patch(':id/volver-a-reportar')
  @Roles('MODERADOR')
  @UseInterceptors(
    FileInterceptor('audio', {
      storage: memoryStorage(),
      limits: { fileSize: 25 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (file.mimetype?.startsWith('audio/')) return cb(null, true);
        return cb(new BadRequestException('Solo archivos de audio'), false);
      },
    }),
  )
  volverAReportar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: VolverAReportarDto,
    @UploadedFile() audio?: Express.Multer.File,
    @CurrentUser() user: { id: number } = { id: 0 },
  ) {
    return this.reportesService.volverAReportar({
      reporteId: id,
      usuarioId: user.id,
      motivo: dto.motivo,
      audio,
    });
  }

  @Patch(':id/re-editar')
  reEditar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReEditarReporteDto,
    @CurrentUser() user: { id: number },
  ) {
    return this.reportesService.reEditar({
      reporteId: id,
      usuarioId: user.id,
      dto,
    });
  }

  @Post(':id/suspender-usuario')
  @Roles('MODERADOR')
  suspenderUsuario(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SuspenderUsuarioDto,
    @CurrentUser() user: { id: number },
  ) {
    return this.reportesService.suspenderUsuario({
      reporteId: id,
      usuarioId: user.id,
      motivo: dto.motivo,
      tipoDuracion: dto.tipoDuracion,
      duracion: dto.duracion,
    });
  }
}
