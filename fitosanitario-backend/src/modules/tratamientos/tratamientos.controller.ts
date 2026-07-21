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
  Query,
} from '@nestjs/common';
import { TratamientosService } from './tratamientos.service';
import { CreateTratamientoDto } from './dto/create-tratamiento.dto';
import { UpdateTratamientoDto } from './dto/update-tratamiento.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('tratamientos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TratamientosController {
  constructor(private readonly tratamientosService: TratamientosService) {}

  // Listado general — cualquier usuario autenticado
  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('cultivoId', new ParseIntPipe({ optional: true })) cultivoId?: number,
  ) {
    return this.tratamientosService.findAll(search, cultivoId);
  }

  // Enciclopedia completa para descarga offline (RF-04)
  // Query opcional: ?desde=2024-01-01 para sync incremental
  @Get('enciclopedia')
  findEnciclopedia(@Query('desde') desde?: string) {
    if (desde) {
      const fecha = new Date(desde);
      if (isNaN(fecha.getTime())) {
        return this.tratamientosService.findEnciclopedia();
      }
      return this.tratamientosService.findEnciclopediaDesde(fecha);
    }
    return this.tratamientosService.findEnciclopedia();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tratamientosService.findById(id);
  }

  // Emitir tratamiento — solo MODERADOR (RF-09)
  @Post()
  @Roles('MODERADOR')
  create(
    @Body() dto: CreateTratamientoDto,
    @CurrentUser() user: { id: number },
  ) {
    return this.tratamientosService.create(dto, user.id);
  }

  // Editar tratamiento con notificación — solo MODERADOR
  @Patch(':id')
  @Roles('MODERADOR')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTratamientoDto,
    @CurrentUser() user: { id: number },
  ) {
    return this.tratamientosService.updateWithNotification(id, dto, user.id);
  }

  // Agregar/quitar de enciclopedia — solo MODERADOR (RF-09)
  @Patch(':id/enciclopedia')
  @Roles('MODERADOR')
  marcarEnciclopedia(
    @Param('id', ParseIntPipe) id: number,
    @Body('enEnciclopedia') enEnciclopedia: boolean,
  ) {
    return this.tratamientosService.marcarEnciclopedia(id, enEnciclopedia);
  }

  // Ver si un reporte ya tiene tratamiento
  @Get('por-reporte/:reporteId')
  findByReporte(@Param('reporteId', ParseIntPipe) reporteId: number) {
    return this.tratamientosService.findByReporte(reporteId);
  }

  // Eliminar tratamiento físicamente — solo MODERADOR
  @Delete(':id')
  @Roles('MODERADOR')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.tratamientosService.delete(id);
  }
}
