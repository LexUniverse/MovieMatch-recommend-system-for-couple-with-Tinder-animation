import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeleteResult } from 'typeorm';
import { RoomEntity, UserEntity } from '../entities';
import { RoomModel } from '../models';
import {HttpService} from "@nestjs/axios";
import { map } from 'rxjs/operators';

@Injectable()
export class RoomService {
    constructor(
        @InjectRepository(RoomEntity)
        private readonly roomRepository: Repository<RoomEntity>,

        @InjectRepository(UserEntity)
        private readonly userRepository: Repository<UserEntity>,

        private readonly httpService: HttpService
    ) {}

    async create(roomModel: RoomModel): Promise<RoomEntity> {
        const users = await this.userRepository.findByIds(roomModel.userIds || []);
        const room = this.roomRepository.create({
            name: roomModel.name,
            users
        });
        return await this.roomRepository.save(room);
    }

    async update(roomEntity: RoomEntity, roomModel: RoomModel): Promise<RoomEntity> {
        const users = await this.userRepository.findByIds(roomModel.userIds || []);
        return await this.roomRepository.save({
            ...roomEntity,
            name: roomModel.name,
            users
        });
    }

    async findById(id: number): Promise<RoomEntity | null> {
        return await this.roomRepository.findOne({
            where: { id },
            relations: ['users']
        });
    }

    async findAll(): Promise<RoomEntity[]> {
        return await this.roomRepository.find({ relations: ['users'] });
    }

    async destroy(id: number): Promise<DeleteResult> {
        return await this.roomRepository.delete(id);
    }

    async getRecommendationsForTwoUsers(roomId: number): Promise<any> {
        // Получаем комнату с пользователями
        const room = await this.roomRepository.findOne({
            where: { id: roomId },
            relations: ['users']
        });

        if (!room) {
            throw new Error(`Комната с id ${roomId} не найдена`);
        }

        if (room.users.length < 2) {
            throw new Error('В комнате должно быть минимум 2 пользователя');
        }

        // Берём первых двух пользователей
        const [user1, user2] = room.users;

        // Получаем предпочтения для каждого пользователя
        const preferences1 = await this.userRepository.query(`
        SELECT "filmId", "rating"
        FROM preferences
        WHERE "userId" = $1
    `, [user1.id]);

        const preferences2 = await this.userRepository.query(`
        SELECT "filmId", "rating"
        FROM preferences
        WHERE "userId" = $1
    `, [user2.id]);

        // Формируем payload для микросервиса
        const payload = {
            user1: preferences1.map(pref => ({
                film_id: pref.filmId,
                rating: pref.rating
            })),
            user2: preferences2.map(pref => ({
                film_id: pref.filmId,
                rating: pref.rating
            }))
        };

        // Отправляем запрос и получаем рекомендации
        const recommendations = await this.httpService.post(
            'http://127.0.0.1:8000/recommendations/two_users',
            payload
        ).pipe(
            map(response => response.data)
        ).toPromise();

        // Добавляем ссылку на постер для каждой рекомендации
        for (let recommendation of recommendations) {
            recommendation.poster_url = `http://127.0.0.1:5000/get_movie_poster/${recommendation.film_id}`;
        }

        return recommendations;
    }
}
