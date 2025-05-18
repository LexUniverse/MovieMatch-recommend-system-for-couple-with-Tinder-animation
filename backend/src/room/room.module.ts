import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomEntity, UserEntity } from '../entities';
import { RoomService } from './room.service';
import { RoomController } from './room.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
    imports: [
        TypeOrmModule.forFeature([RoomEntity, UserEntity]),
        HttpModule
    ],
    providers: [RoomService],
    controllers: [RoomController],
    exports: [RoomService]
})
export class RoomModule {}
