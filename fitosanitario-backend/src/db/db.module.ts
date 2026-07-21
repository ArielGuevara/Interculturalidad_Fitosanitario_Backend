import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

export const DB_CONNECTION = 'DB_CONNECTION';

@Global()
@Module({
  providers: [
    {
      provide: DB_CONNECTION,
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const connectionString = configService.get<string>('databaseUrl');
        const pool = new Pool({ connectionString });
        
        // Asegurar que la extensión unaccent esté habilitada en PostgreSQL
        try {
          await pool.query('CREATE EXTENSION IF NOT EXISTS unaccent;');
        } catch (err) {
          console.error('Error al inicializar la extensión unaccent:', err);
        }

        return drizzle(pool, { schema });
      },
    },
  ],
  exports: [DB_CONNECTION],
})
export class DbModule {}
