import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PreferenceEntity, FilmEntity, UserEntity } from '../entities';
import { PreferenceService } from './preferences.service';
import { PreferenceController } from './preferences.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([PreferenceEntity, FilmEntity, UserEntity])
    ],
    providers: [PreferenceService],
    controllers: [PreferenceController],
    exports: [PreferenceService]
})
export class PreferenceModule {}
