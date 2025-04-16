import * as path from 'path';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from 'nestjs-config';
import { DeleteResult } from 'typeorm';

import { PreferenceService } from './preferences.service';
import { PreferenceEntity, FilmEntity, UserEntity } from '../entities';

describe('PreferenceService', () => {
    let module: TestingModule;
    let app: INestApplication;
    let preferenceService: PreferenceService;
    let preference: PreferenceEntity;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [
                ConfigModule.load(path.resolve(__dirname, '../', 'config', '*.ts')),
                TypeOrmModule.forRootAsync({
                    useFactory: (config: ConfigService) => config.get('database'),
                    inject: [ConfigService]
                }),
                TypeOrmModule.forFeature([PreferenceEntity, FilmEntity, UserEntity])
            ],
            providers: [PreferenceService]
        }).compile();

        app = await module.createNestApplication();
        await app.init();

        preferenceService = module.get(PreferenceService);
    });

    it('create', async () => {
        preference = await preferenceService.create({
            userId: 1,
            filmId: 1,
            rating: 5
        });
        expect(preference).toBeInstanceOf(PreferenceEntity);
    });

    it('findById', async () => {
        const found = await preferenceService.findById(preference.id);
        expect(found).toBeInstanceOf(PreferenceEntity);
    });

    it('update', async () => {
        const updated = await preferenceService.update(preference, {
            userId: preference.user.id,
            filmId: preference.film.id,
            rating: 4
        });
        expect(updated.rating).toBe(4);
    });

    it('destroy', async () => {
        const result = await preferenceService.destroy(preference.id);
        expect(result).toBeInstanceOf(DeleteResult);
    });

    afterAll(async () => {
        await app.close();
    });
});
