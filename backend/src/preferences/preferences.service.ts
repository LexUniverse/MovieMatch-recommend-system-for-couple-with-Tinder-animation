import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeleteResult } from 'typeorm';
import { PreferenceEntity, FilmEntity, UserEntity } from '../entities';
import { PreferenceModel } from '../models';

@Injectable()
export class PreferenceService {
    constructor(
        @InjectRepository(PreferenceEntity)
        private readonly preferenceRepository: Repository<PreferenceEntity>,
        @InjectRepository(UserEntity)
        private readonly userRepository: Repository<UserEntity>,
        @InjectRepository(FilmEntity)
        private readonly filmRepository: Repository<FilmEntity>
    ) {}

    async create(prefModel: PreferenceModel): Promise<PreferenceEntity> {
        const user = await this.userRepository.findOne({ where: { id: prefModel.userId } });
        const film = await this.filmRepository.findOne({ where: { id: prefModel.filmId } });

        const preference = this.preferenceRepository.create({
            ...prefModel,
            user,
            film,
        });

        return await this.preferenceRepository.save(preference);
    }

    async findAll(): Promise<PreferenceEntity[]> {
        return await this.preferenceRepository.find({
            relations: ['user', 'film'],
        });
    }

    async findById(id: number): Promise<PreferenceEntity | null> {
        return await this.preferenceRepository.findOne({
            where: { id },
            relations: ['user', 'film'],
        });
    }

    async update(pref: PreferenceEntity, update: PreferenceModel): Promise<PreferenceEntity> {
        const user = await this.userRepository.findOne({ where: { id: update.userId } });
        const film = await this.filmRepository.findOne({ where: { id: update.filmId } });

        return await this.preferenceRepository.save({
            ...pref,
            ...update,
            user,
            film,
        });
    }

    async destroy(id: number): Promise<DeleteResult> {
        return await this.preferenceRepository.delete(id);
    }
}
