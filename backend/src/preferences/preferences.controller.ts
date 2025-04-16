import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { PreferenceService } from './preferences.service';
import { PreferenceModel } from '../models';
import { PreferenceEntity } from '../entities';

@Controller('preferences')
export class PreferenceController {
    constructor(private readonly preferenceService: PreferenceService) {}

    @Post()
    create(@Body() dto: PreferenceModel): Promise<PreferenceEntity> {
        return this.preferenceService.create(dto);
    }

    @Get()
    findAll(): Promise<PreferenceEntity[]> {
        return this.preferenceService.findAll();
    }

    @Get(':id')
    findById(@Param('id') id: number): Promise<PreferenceEntity | null> {
        return this.preferenceService.findById(id);
    }

    @Patch(':id')
    async update(@Param('id') id: number, @Body() dto: PreferenceModel): Promise<PreferenceEntity> {
        const pref = await this.preferenceService.findById(id);
        return this.preferenceService.update(pref!, dto);
    }

    @Delete(':id')
    destroy(@Param('id') id: number) {
        return this.preferenceService.destroy(id);
    }
}
