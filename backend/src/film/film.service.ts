import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeleteResult } from 'typeorm';
import { FilmEntity } from '../entities';
import { GenreEntity } from '../entities';
import { FilmModel } from '../models';

@Injectable()
export class FilmService {
    constructor(
        @InjectRepository(FilmEntity)
        private readonly filmRepository: Repository<FilmEntity>,

        @InjectRepository(GenreEntity)
        private readonly genreRepository: Repository<GenreEntity>
    ) {}

    async create(filmModel: FilmModel): Promise<FilmEntity> {
        const genres = await this.genreRepository.findByIds(filmModel.genreIds || []);

        const film = this.filmRepository.create({
            title: filmModel.title,
            year: filmModel.year,
            genres
        });

        return await this.filmRepository.save(film);
    }

    async update(filmEntity: FilmEntity, filmModel: FilmModel): Promise<FilmEntity> {
        const genres = await this.genreRepository.findByIds(filmModel.genreIds || []);
        return await this.filmRepository.save({
            ...filmEntity,
            title: filmModel.title,
            year: filmModel.year,
            genres
        });
    }

    async findById(id: number): Promise<FilmEntity | null> {
        return await this.filmRepository.findOne({
            where: { id },
            relations: ['genres']
        });
    }

    async findAll(): Promise<FilmEntity[]> {
        return await this.filmRepository.find({
            relations: ['genres']
        });
    }

    async destroy(id: number): Promise<DeleteResult> {
        return await this.filmRepository.delete(id);
    }

    async findByTitle(title: string): Promise<FilmEntity | null> {
        return await this.filmRepository.findOne({
            where: { title },
            relations: ['genres']
        });
    }

}
