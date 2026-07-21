import {
  Controller, Get, Post, Patch, Delete, Body, Param,
  ParseIntPipe, UseGuards, Req, Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permisos } from '../../common/decorators/permisos.decorator';
import { PermisosGuard } from '../../common/guards/permisos.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UsuariosService } from './usuarios.service';

@Controller('usuarios')
@UseGuards(JwtAuthGuard)
export class UsuariosController {
  constructor(private readonly service: UsuariosService) {}

  @Get('me')
  getProfile(@CurrentUser() user: { id: number }) {
    return this.service.findById(user.id);
  }

  @Patch('me/password')
  changePassword(
    @CurrentUser() user: { id: number },
    @Body() dto: { currentPassword: string; newPassword: string },
  ) {
    return this.service.changePassword(user.id, dto.currentPassword, dto.newPassword);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('MODERADOR', 'ADMIN')
  findAll(@Query('rol') rol?: string) {
    return this.service.findAll(rol);
  }

  @Get('suspensiones-activas')
  @UseGuards(RolesGuard)
  @Roles('MODERADOR', 'ADMIN')
  findSuspensionesActivas() {
    return this.service.findAllActiveSuspensions();
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('MODERADOR', 'ADMIN')
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.service.findById(id);
  }

  @Post('moderador')
  @UseGuards(RolesGuard, PermisosGuard)
  @Roles('MODERADOR', 'ADMIN')
  @Permisos('usuarios')
  createModerator(
    @Body() dto: { nombre: string; email: string; telefono?: string; cargo?: string; permisos?: string[] },
  ) {
    return this.service.createModerator(dto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard, PermisosGuard)
  @Roles('MODERADOR', 'ADMIN')
  @Permisos('usuarios')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: { nombre?: string; email?: string; telefono?: string; cargo?: string; rol?: 'AGRICULTOR' | 'MODERADOR' | 'ADMIN'; permisos?: string[]; activo?: boolean },
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard, PermisosGuard)
  @Roles('MODERADOR', 'ADMIN')
  @Permisos('usuarios')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.logicalDelete(id);
  }

  @Post(':id/restore')
  @UseGuards(RolesGuard, PermisosGuard)
  @Roles('MODERADOR', 'ADMIN')
  @Permisos('usuarios')
  restore(@Param('id', ParseIntPipe) id: number) {
    return this.service.restore(id);
  }

  @Post(':id/suspender')
  @UseGuards(RolesGuard)
  @Roles('MODERADOR', 'ADMIN')
  suspender(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: { motivo: string; tipoDuracion: 'TIEMPO' | 'DIAS'; duracion: number },
  ) {
    return this.service.suspenderUsuario({
      usuarioId: id,
      motivo: dto.motivo,
      tipoDuracion: dto.tipoDuracion,
      duracion: dto.duracion,
    });
  }

  @Post(':id/reactivar')
  @UseGuards(RolesGuard)
  @Roles('MODERADOR', 'ADMIN')
  reactivar(@Param('id', ParseIntPipe) id: number) {
    return this.service.reactivarUsuario(id);
  }

  @Get(':id/suspension/activa')
  @UseGuards(RolesGuard)
  @Roles('MODERADOR', 'ADMIN')
  getSuspensionActiva(@Param('id', ParseIntPipe) id: number) {
    return this.service.getSuspensionActiva(id);
  }
}
