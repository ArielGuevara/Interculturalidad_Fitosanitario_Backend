import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'; 
import { envConfig } from './config/env';

import { AuthModule } from './modules/auth/auth.module';
import { UsuariosModule } from './modules/usuarios/usuarios.module';
import { CultivosModule } from './modules/cultivos/cultivos.module';
import { PlagasModule } from './modules/plagas/plagas.module';
import { ProductosModule } from './modules/productos/productos.module';
import { MultimediaModule } from './modules/multimedia/multimedia.module';
import { ReportesModule } from './modules/reportes/reportes.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DbModule } from './db/db.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, 
      load: [envConfig],
    }),
    DbModule,
    AuthModule,
    UsuariosModule,
    CultivosModule,
    PlagasModule,
    ProductosModule,
    MultimediaModule,
    ReportesModule,
  ],
  controllers: [AppController], 
  providers: [AppService],
})
export class AppModule {}