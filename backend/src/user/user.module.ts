import { Module } from '@nestjs/common';
import { UserEntity } from './../entities';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { ConfigModule } from 'nestjs-config';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([UserEntity]), HttpModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
