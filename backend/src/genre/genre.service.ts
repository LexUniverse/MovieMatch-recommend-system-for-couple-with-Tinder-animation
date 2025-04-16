import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeleteResult } from 'typeorm';
import { GenreEntity } from '../entities';
import { GenreModel } from '../models';

@Injectable()
export class GenreService {
    constructor(
        @InjectRepository(GenreEntity)
        private readonly genreRepository: Repository<GenreEntity>
    ) {}

    async create(genre: GenreModel): Promise<GenreEntity> {
        return await this.genreRepository.save(this.genreRepository.create(genre));
    }

    async findAll(): Promise<GenreEntity[]> {
        return await this.genreRepository.find();
    }

    async findById(id: number): Promise<GenreEntity | null> {
        return await this.genreRepository.findOne({ where: { id } });
    }

    async update(genre: GenreEntity, updated: GenreModel): Promise<GenreEntity> {
        return await this.genreRepository.save({
            ...genre,
            name: updated.name,
        });
    }

    async destroy(id: number): Promise<DeleteResult> {
        return await this.genreRepository.delete(id);
    }
}
