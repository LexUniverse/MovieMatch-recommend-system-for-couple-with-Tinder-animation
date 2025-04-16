import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GenreEntity } from '../entities';
import { GenreService } from './genre.service';
import { GenreController } from './genre.controller';

@Module({
    imports: [TypeOrmModule.forFeature([GenreEntity])],
    providers: [GenreService],
    controllers: [GenreController],
    exports: [GenreService]
})
export class GenreModule {}
