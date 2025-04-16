import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { RoomService } from './room.service';
import { RoomModel } from '../models';
import { RoomEntity } from '../entities';

@Controller('rooms')
export class RoomController {
    constructor(private readonly roomService: RoomService) {}

    @Post()
    create(@Body() dto: RoomModel): Promise<RoomEntity> {
        return this.roomService.create(dto);
    }

    @Get()
    findAll(): Promise<RoomEntity[]> {
        return this.roomService.findAll();
    }

    @Get(':id')
    findById(@Param('id') id: number): Promise<RoomEntity | null> {
        return this.roomService.findById(id);
    }

    @Patch(':id')
    async update(@Param('id') id: number, @Body() dto: RoomModel): Promise<RoomEntity> {
        const room = await this.roomService.findById(id);
        return this.roomService.update(room!, dto);
    }

    @Delete(':id')
    destroy(@Param('id') id: number) {
        return this.roomService.destroy(id);
    }
}
