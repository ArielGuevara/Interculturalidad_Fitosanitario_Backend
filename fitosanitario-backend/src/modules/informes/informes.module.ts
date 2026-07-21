import { Module } from '@nestjs/common';
import { InformesService } from './informes.service';
import { InformesController } from './informes.controller';
import { CultivosModule } from '../cultivos/cultivos.module';
import { PlagasModule } from '../plagas/plagas.module';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { ProductosModule } from '../productos/productos.module';
import { TratamientosModule } from '../tratamientos/tratamientos.module';

@Module({
  imports: [
    CultivosModule,
    PlagasModule,
    UsuariosModule,
    ProductosModule,
    TratamientosModule,
  ],
  controllers: [InformesController],
  providers: [InformesService],
})
export class InformesModule {}
