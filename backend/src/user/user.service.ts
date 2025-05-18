import * as bcrypt from "bcrypt";

import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, UpdateResult, DeleteResult } from "typeorm";
import { ConfigService, InjectConfig } from "nestjs-config";

import { UserEntity as User, UserEntity } from "./../entities";
import { UserModel } from "../models";

import { HttpService } from '@nestjs/axios';
import { map } from 'rxjs/operators';


@Injectable()
export class UserService {
  private saltRounds: number;

  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectConfig() private readonly config: ConfigService,
    private readonly httpService: HttpService
  ) {
    this.saltRounds = config.get("app.salt_rounds", 10);
  }

  async create(user: UserModel): Promise<User> {
    const userToCreate = {
      ...user,
      password: user.password ? await this.getHash(user.password) : null,
    };

    const result = await this.userRepository.save(
      this.userRepository.create(userToCreate)
    );

    return result;
  }

  async update(userEntity: UserEntity, user: UserModel): Promise<UserEntity> {
    return await this.userRepository.save({
      ...userEntity,
      name: user.name,
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: {
        email,
      },
    });
  }

  async findByVkId(vk_id: number): Promise<User | null> {
    return await this.userRepository.findOne({
      where: {
        vk_id,
      },
    });
  }

  async findById(id: number): Promise<UserEntity | null> {
    return await this.userRepository.findOneOrFail(id);
  }

  async findAll(): Promise<UserEntity[]> {
    return await this.userRepository.find();
  }

  async getHash(password: string): Promise<string> {
    return await bcrypt.hash(password, this.saltRounds);
  }

  async compareHash(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  async destroy(id: number): Promise<DeleteResult> {
    return await this.userRepository.delete(id);
  }

  async findByEmailWithPassword(email: string): Promise<User> | null {
    return await this.userRepository.findOne(
      {
        email,
      },
      {
        select: ["email", "password", "id", "grant", "name", "avatar_url"],
      }
    );
  }
  async getRecommendations(userId: number): Promise<any> {
    // 1. Получаем предпочтения пользователя
    const preferences = await this.userRepository.query(`
    SELECT "filmId", "rating" 
    FROM preferences 
    WHERE "userId" = $1
  `, [userId]);

    // 2. Формируем payload
    const payload = preferences.map(pref => ({
      film_id: pref.filmId,
      rating: pref.rating
    }));


    // 4. Отправляем запрос
    const recommendations = await this.httpService.post(
        'http://127.0.0.1:8000/recommendations',
        payload
    ).pipe(
        map(response => response.data)
    ).toPromise();

    return recommendations;
  }


}
