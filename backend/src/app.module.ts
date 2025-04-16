import * as path from 'path';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from 'nestjs-config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';

import { UserModule } from './user';
import { AuthModule } from './auth';
import { FilmModule } from './film';
import { GenreModule } from './genre';
import { PreferenceModule } from './preferences';
import { RoomModule } from './room';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.load(path.resolve(__dirname, 'config', '*.{ts,js}')),
    TypeOrmModule.forRootAsync({
      useFactory: (config: ConfigService) => config.get('database'),
      inject: [ConfigService],
    }),
    UserModule,
    AuthModule,
    FilmModule,
    GenreModule,
    PreferenceModule,
    RoomModule,
  ],
})
export class AppModule {}
