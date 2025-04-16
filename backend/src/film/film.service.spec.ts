import * as path from 'path';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from 'nestjs-config';
import { DeleteResult } from 'typeorm';

import { FilmEntity, GenreEntity } from '../entities';
import { FilmService } from './film.service';
import { FilmModel } from '../models';

describe('FilmService', () => {
    let module: TestingModule;
    let app: INestApplication;
    let filmService: FilmService;
    let film: FilmEntity;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [
                ConfigModule.load(path.resolve(__dirname, '../', 'config', '*.ts')),
                TypeOrmModule.forRootAsync({
                    useFactory: (config: ConfigService) => config.get('database'),
                    inject: [ConfigService],
                }),
                TypeOrmModule.forFeature([FilmEntity, GenreEntity])
            ],
            providers: [FilmService],
        }).compile();

        app = await module.createNestApplication();
        await app.init();

        filmService = module.get(FilmService);
    });

    it('create', async () => {
        film = await filmService.create({
            title: 'Test Film',
            year: 2024,
            genreIds: []  // если жанров нет, передаем пустой массив
        });
        expect(film).toBeInstanceOf(FilmEntity);
        expect(film.year).toBe(2024);
    });

    it('findById', async () => {
        const found = await filmService.findById(film.id);
        expect(found).toBeInstanceOf(FilmEntity);
        expect(found?.id).toBe(film.id);
    });

    it('findAll', async () => {
        const films = await filmService.findAll();
        expect(Array.isArray(films)).toBeTruthy();
        expect(films.length).toBeGreaterThan(0);
    });

    it('update', async () => {
        const updated = await filmService.update(film, {
            title: 'Updated Title',
            year: 2025,
            genreIds: []
        });
        expect(updated).toBeInstanceOf(FilmEntity);
        expect(updated.title).toBe('Updated Title');
        expect(updated.year).toBe(2025);
    });

    it('destroy', async () => {
        const result = await filmService.destroy(film.id);
        expect(result).toBeInstanceOf(DeleteResult);
    });

    afterAll(async () => {
        await app.close();
    });
});
