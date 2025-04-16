import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { GenreService } from './genre.service';
import { GenreModel } from '../models';
import { GenreEntity } from '../entities';

@Controller('genres')
export class GenreController {
    constructor(private readonly genreService: GenreService) {}

    @Post()
    create(@Body() dto: GenreModel): Promise<GenreEntity> {
        return this.genreService.create(dto);
    }

    @Get()
    findAll(): Promise<GenreEntity[]> {
        return this.genreService.findAll();
    }

    @Get(':id')
    findById(@Param('id') id: number): Promise<GenreEntity | null> {
        return this.genreService.findById(id);
    }

    @Patch(':id')
    async update(@Param('id') id: number, @Body() dto: GenreModel): Promise<GenreEntity> {
        const genre = await this.genreService.findById(id);
        return this.genreService.update(genre!, dto);
    }

    @Delete(':id')
    destroy(@Param('id') id: number) {
        return this.genreService.destroy(id);
    }
}
