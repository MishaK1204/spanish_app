import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { VocabularyModule } from './vocabulary/vocabulary.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    ServeStaticModule.forRoot({
      // In production we run with cwd = `backend/` (see root `render:start`).
      // In dev (`nest start`) cwd is also `backend/`. So `public/` should be relative to cwd.
      rootPath: join(process.cwd(), 'public'),
      exclude: ['/auth*', '/vocabulary*'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        // Prefer Render-style connection string if provided.
        // Render sets DATABASE_URL / INTERNAL_DATABASE_URL depending on your configuration.
        url:
          config.get<string>('DATABASE_URL') ??
          config.get<string>('INTERNAL_DATABASE_URL') ??
          undefined,
        host: config.get<string>('DB_HOST', 'localhost'),
        port: Number(config.get<string>('DB_PORT', '5432')),
        username: config.get<string>('DB_USERNAME', 'postgres'),
        password: config.get<string>('DB_PASSWORD', ''),
        database: config.get<string>('DB_NAME', 'spanish'),
        ssl:
          // Render Postgres typically requires SSL from app containers.
          // Enable by default in production, overridable via DB_SSL.
          config.get<string>('DB_SSL', config.get<string>('NODE_ENV') === 'production' ? 'true' : 'false') === 'true'
            ? {
                rejectUnauthorized:
                  // Render uses publicly trusted certs, but some Node setups still need this false.
                  // Make it configurable; default to false in production for maximum compatibility.
                  config.get<string>(
                    'DB_SSL_REJECT_UNAUTHORIZED',
                    config.get<string>('NODE_ENV') === 'production' ? 'false' : 'true',
                  ) === 'true',
              }
            : undefined,
        autoLoadEntities: true,
        synchronize: config.get<string>('DB_SYNCHRONIZE', 'false') === 'true',
      }),
    }),
    VocabularyModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
