import { Entity, Column, ManyToMany, JoinTable } from 'typeorm';
import BaseEntity from './base.entity';
import { GenreEntity } from './genre.entity';

@Entity('films')
export class FilmEntity extends BaseEntity {
    @Column()
    title: string;

    @Column()
    russian_title: string;

    @Column({ nullable: true })
    year: number;

    @ManyToMany(() => GenreEntity, genre => genre.films)
    @JoinTable()
    genres: GenreEntity[];
}
