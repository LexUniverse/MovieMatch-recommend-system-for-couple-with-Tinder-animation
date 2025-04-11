import { Entity, Column, ManyToMany, JoinTable } from 'typeorm';
import BaseEntity from './base.entity';
import { GenreEntity } from './genre.entity';

@Entity('films')
export class FilmEntity extends BaseEntity {
    @Column()
    title: string;

    @Column({ nullable: true })
    year: number;

    @Column({ nullable: true })
    poster_url: string;

    @ManyToMany(() => GenreEntity, genre => genre.films)
    @JoinTable()
    genres: GenreEntity[];
}
