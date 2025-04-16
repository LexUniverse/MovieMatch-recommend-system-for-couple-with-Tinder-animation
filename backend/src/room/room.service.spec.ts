import * as path from 'path';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from 'nestjs-config';
import { DeleteResult } from 'typeorm';

import { RoomService } from './room.service';
import { RoomEntity, UserEntity } from '../entities';

describe('RoomService', () => {
    let module: TestingModule;
    let app: INestApplication;
    let roomService: RoomService;
    let room: RoomEntity;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [
                ConfigModule.load(path.resolve(__dirname, '../', 'config', '*.ts')),
                TypeOrmModule.forRootAsync({
                    useFactory: (config: ConfigService) => config.get('database'),
                    inject: [ConfigService]
                }),
                TypeOrmModule.forFeature([RoomEntity, UserEntity])
            ],
            providers: [RoomService]
        }).compile();

        app = await module.createNestApplication();
        await app.init();

        roomService = module.get(RoomService);
    });

    it('create', async () => {
        room = await roomService.create({
            name: 'Test Room',
            userIds: []
        });
        expect(room).toBeInstanceOf(RoomEntity);
    });

    it('findById', async () => {
        const found = await roomService.findById(room.id);
        expect(found).toBeInstanceOf(RoomEntity);
    });

    it('update', async () => {
        const updated = await roomService.update(room, {
            name: 'Updated Room',
            userIds: []
        });
        expect(updated.name).toBe('Updated Room');
    });

    it('destroy', async () => {
        const result = await roomService.destroy(room.id);
        expect(result).toBeInstanceOf(DeleteResult);
    });

    afterAll(async () => {
        await app.close();
    });
});
