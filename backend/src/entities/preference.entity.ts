import { Entity, Column, ManyToOne } from 'typeorm';
import BaseEntity from './base.entity';
import { UserEntity } from './user.entity';
import { FilmEntity } from './film.entity';

@Entity('preferences')
export class PreferenceEntity extends BaseEntity {
    @ManyToOne(() => UserEntity, user => user.preferences)
    user: UserEntity;

    @ManyToOne(() => FilmEntity)
    film: FilmEntity;

    @Column('float')
    rating: number;
}
