import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor, FileFieldsInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ComunidadService } from './comunidad.service';
import { MultimediaService } from '../multimedia/multimedia.service';
import { CreateRecomendacionDto } from './dto/create-recomendacion.dto';
import { CreateValoracionDto } from './dto/create-valoracion.dto';
import { CreateComentarioDto } from './dto/create-comentario.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class ComunidadController {
  constructor(
    private readonly comunidadService: ComunidadService,
    private readonly multimediaService: MultimediaService,
  ) {}

  // ── Recomendaciones ────────────────────────────────────────

  @Get('reportes/:reporteId/recomendaciones')
  findRecomendaciones(@Param('reporteId', ParseIntPipe) reporteId: number) {
    return this.comunidadService.findRecomendacionesByReporte(reporteId);
  }

  @Post('reportes/:reporteId/recomendaciones')
  createRecomendacion(
    @Param('reporteId', ParseIntPipe) reporteId: number,
    @Body() dto: CreateRecomendacionDto,
    @CurrentUser() user: { id: number },
  ) {
    return this.comunidadService.createRecomendacion(
      { ...dto, reporteId },
      user.id,
    );
  }

  @Delete('recomendaciones/:id')
  @Roles('MODERADOR')
  desactivarRecomendacion(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { id: number },
  ) {
    return this.comunidadService.desactivarRecomendacion(id, user.id);
  }

  @Patch('recomendaciones/:id/toggle')
  @Roles('MODERADOR', 'ADMIN')
  toggleRecomendacion(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { id: number },
  ) {
    return this.comunidadService.toggleRecomendacion(id, user.id);
  }

  // ── Valoraciones ───────────────────────────────────────────

  @Post('recomendaciones/:id/valorar')
  valorar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateValoracionDto,
    @CurrentUser() user: { id: number },
  ) {
    return this.comunidadService.valorar(id, user.id, dto);
  }

  // ── Comentarios ────────────────────────────────────────────

  @Get('recomendaciones/:id/comentarios')
  findComentarios(@Param('id', ParseIntPipe) id: number) {
    return this.comunidadService.findComentarios(id);
  }

  @Post('recomendaciones/:id/comentarios')
  createComentario(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateComentarioDto,
    @CurrentUser() user: { id: number },
  ) {
    return this.comunidadService.createComentario(id, user.id, dto);
  }

  @Post('recomendaciones/:id/comentarios/with-audio')
  @UseInterceptors(FileInterceptor('audio', { storage: memoryStorage() }))
  async createComentarioWithAudio(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateComentarioDto,
    @UploadedFile() audio: Express.Multer.File,
    @CurrentUser() user: { id: number },
  ) {
    let audioUrl: string | null = null;
    if (audio) {
      const upload = await this.multimediaService.uploadAudio(audio);
      audioUrl = upload.url;
    }
    return this.comunidadService.createComentario(id, user.id, { ...dto, audioUrl });
  }

  @Post('recomendaciones/:id/comentarios/with-image')
  @UseInterceptors(FileInterceptor('imagen', { storage: memoryStorage() }))
  async createComentarioWithImage(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateComentarioDto,
    @UploadedFile() imagen: Express.Multer.File,
    @CurrentUser() user: { id: number },
  ) {
    let imagenUrl: string | undefined;
    if (imagen) {
      const upload = await this.multimediaService.uploadImage(imagen);
      imagenUrl = upload.url;
    }
    return this.comunidadService.createComentario(id, user.id, { ...dto, imagenUrl });
  }

  @Delete('comentarios/:id')
  desactivarComentario(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { id: number; rol: string },
  ) {
    return this.comunidadService.desactivarComentario(id, user.id, user.rol);
  }
}
