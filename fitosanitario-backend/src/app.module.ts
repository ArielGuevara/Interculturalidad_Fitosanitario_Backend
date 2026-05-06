import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'; 
import { envConfig } from './config/env';

import { AuthModule } from './modules/auth/auth.module';
import { UsuariosModule } from './modules/usuarios/usuarios.module';
import { CultivosModule } from './modules/cultivos/cultivos.module';
import { PlagasModule } from './modules/plagas/plagas.module';
import { ProductosModule } from './modules/productos/productos.module';
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
    ProductosModule
  ],
  controllers: [AppController], 
  providers: [AppService],
})
export class AppModule {}