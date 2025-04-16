import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeleteResult } from 'typeorm';
import { RoomEntity, UserEntity } from '../entities';
import { RoomModel } from '../models';

@Injectable()
export class RoomService {
    constructor(
        @InjectRepository(RoomEntity)
        private readonly roomRepository: Repository<RoomEntity>,

        @InjectRepository(UserEntity)
        private readonly userRepository: Repository<UserEntity>
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
}
