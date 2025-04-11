import { Entity, Column, ManyToMany, JoinTable } from 'typeorm';
import BaseEntity from './base.entity';
import { UserEntity } from './user.entity';

@Entity('rooms')
export class RoomEntity extends BaseEntity {
    @Column()
    name: string;

    @ManyToMany(() => UserEntity, user => user.rooms)
    @JoinTable()
    users: UserEntity[];
}
