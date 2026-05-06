import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { OptionalJwtAuthGuard } from './optional-jwt.guard';
import { User } from './user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const expiresSeconds = parseInt(
          config.get<string>('JWT_EXPIRES_SECONDS', String(60 * 60 * 24 * 7)),
          10,
        );
        return {
          secret: config.get<string>('JWT_SECRET', 'dev-secret-change-me'),
          signOptions: {
            expiresIn: Number.isFinite(expiresSeconds) ? expiresSeconds : 60 * 60 * 24 * 7,
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, OptionalJwtAuthGuard, JwtAuthGuard],
  exports: [JwtModule, OptionalJwtAuthGuard, JwtAuthGuard],
})
export class AuthModule {}
