import { Entity, Column, ManyToMany } from 'typeorm';
import BaseEntity from './base.entity';
import { FilmEntity } from './film.entity';

@Entity('genres')
export class GenreEntity extends BaseEntity {
    @Column()
    name: string;

    @ManyToMany(() => FilmEntity, film => film.genres)
    films: FilmEntity[];
}
