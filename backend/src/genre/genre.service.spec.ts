import * as path from 'path';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from 'nestjs-config';
import { DeleteResult } from 'typeorm';
import { GenreEntity } from '../entities';
import { GenreService } from './genre.service';

describe('GenreService', () => {
    let module: TestingModule;
    let app: INestApplication;
    let genreService: GenreService;
    let genre: GenreEntity;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [
                ConfigModule.load(path.resolve(__dirname, '../', 'config', '*.ts')),
                TypeOrmModule.forRootAsync({
                    useFactory: (config: ConfigService) => config.get('database'),
                    inject: [ConfigService]
                }),
                TypeOrmModule.forFeature([GenreEntity])
            ],
            providers: [GenreService]
        }).compile();

        app = await module.createNestApplication();
        await app.init();

        genreService = module.get(GenreService);
    });

    it('create', async () => {
        genre = await genreService.create({ name: 'Sci-Fi' });
        expect(genre).toBeInstanceOf(GenreEntity);
    });

    it('findById', async () => {
        const found = await genreService.findById(genre.id);
        expect(found).toBeInstanceOf(GenreEntity);
        expect(found?.id).toBe(genre.id);
    });

    it('update', async () => {
        const updated = await genreService.update(genre, { name: 'Science Fiction' });
        expect(updated.name).toBe('Science Fiction');
    });

    it('findAll', async () => {
        const genres = await genreService.findAll();
        expect(Array.isArray(genres)).toBeTruthy();
        expect(genres.length).toBeGreaterThan(0);
    });

    it('destroy', async () => {
        const result = await genreService.destroy(genre.id);
        expect(result).toBeInstanceOf(DeleteResult);
    });

    afterAll(async () => {
        await app.close();
    });
});
