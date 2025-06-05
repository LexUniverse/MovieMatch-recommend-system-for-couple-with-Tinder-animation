import BaseEntity from "./base.entity";
import { Entity, Column, OneToMany, ManyToMany } from "typeorm";
import { PreferenceEntity } from './preference.entity';
import { RoomEntity } from './room.entity';

@Entity()
export class UserEntity extends BaseEntity {
  @Column({
    nullable: true,
  })
  vk_id: number;

  @Column()
  name: string;

  @Column({
    unique: true,
    nullable: true,
  })
  email: string;

  @Column({
    select: false,
    nullable: true,
  })
  password: string;

  @Column({
    nullable: false,
  })
  grant: number;

  @Column()
  avatar_url: string;

  @OneToMany(() => PreferenceEntity, preference => preference.user)
  preferences: PreferenceEntity[];

  @ManyToMany(() => RoomEntity, room => room.users)
  rooms: RoomEntity[];

}

