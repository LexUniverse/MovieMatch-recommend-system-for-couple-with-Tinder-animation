import { IsEmail, IsString } from "class-validator";

export class AuthModel {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

export class AuthVK {
  code: string;
}

export class AuthVK2 {
  code: string;
  device_id: string;
}
