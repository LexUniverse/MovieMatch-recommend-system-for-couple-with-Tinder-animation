import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomEntity, UserEntity } from '../entities';
import { RoomService } from './room.service';
import { RoomController } from './room.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([RoomEntity, UserEntity])
    ],
    providers: [RoomService],
    controllers: [RoomController],
    exports: [RoomService]
})
export class RoomModule {}
