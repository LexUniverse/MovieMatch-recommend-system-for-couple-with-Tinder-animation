import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FilmEntity } from '../entities';
import { FilmController } from './film.controller';
import { FilmService } from './film.service';
import { ConfigModule } from 'nestjs-config';
import { GenreModule } from '../genre/genre.module';

@Module({
    imports: [
        ConfigModule,
        TypeOrmModule.forFeature([FilmEntity]),
        GenreModule
    ],
    controllers: [FilmController],
    providers: [FilmService],
    exports: [FilmService],
})
export class FilmModule {}
