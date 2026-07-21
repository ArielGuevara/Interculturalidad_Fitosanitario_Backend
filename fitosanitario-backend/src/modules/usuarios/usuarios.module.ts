import { Module } from '@nestjs/common';
import { UsuariosRepository } from './usuarios.repository';
import { UsuariosController } from './usuarios.controller';
import { UsuariosService } from './usuarios.service';
import { AlertasModule } from '../alertas/alertas.module';

@Module({
  imports: [AlertasModule],
  controllers: [UsuariosController],
  providers: [UsuariosRepository, UsuariosService],
  exports: [UsuariosRepository, UsuariosService],
})
export class UsuariosModule {}
