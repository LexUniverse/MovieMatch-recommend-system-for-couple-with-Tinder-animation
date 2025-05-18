import { Injectable, BadRequestException, HttpService } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as VKID from '@vkid/sdk';
import { UserService } from "./../user";
import { UserEntity } from "../entities";
import { JwtPayloadInterface } from "./interfaces";
import { AuthModel, UserDTO } from "../models";

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private http: HttpService
  ) {}

  async validateUser(payload: JwtPayloadInterface): Promise<UserEntity | null> {
    return await this.userService.findById(payload.id);
  }

  async authenticate(
    auth: AuthModel,
    skipPasswordCheck: boolean = false
  ): Promise<UserDTO> {
    const user = await this.userService.findByEmailWithPassword(auth.email);

    if (!user) {
      throw new BadRequestException();
    }

    const isRightPassword =
      user.password && !skipPasswordCheck
        ? await this.userService.compareHash(auth.password, user.password)
        : true;

    if (!isRightPassword) {
      throw new BadRequestException("Invalid credentials");
    }

    return {
      id: user.id,
      vk_id: user.vk_id,
      email: user.email,
      grant: user.grant,
      name: user.name,
      avatar_url: user.avatar_url,
      token: await this.jwtService.sign({ id: user.id }),
    };
  }

  async getVkToken(code: string): Promise<any> {
    const VKDATA = {
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
    };

    const host =
        process.env.NODE_ENV === "prod"
            ? process.env.APP_HOST
            : process.env.APP_LOCAL;

    const url = `https://oauth.vk.com/access_token?client_id=${VKDATA.client_id}&client_secret=${VKDATA.client_secret}&redirect_uri=${host}&code=${code}`;

    console.log("[AuthService] getVkToken - Request URL:", url);

    try {
      const response = await this.http.get(url).toPromise();

      console.log("[AuthService] getVkToken - Response status:", response.status);
      console.log("[AuthService] getVkToken - Response data:", response.data);

      return response;
    } catch (error) {
      if (error.response) {
        console.error("[AuthService] getVkToken - Error response status:", error.response.status);
        console.error("[AuthService] getVkToken - Error response data:", error.response.data);
      } else {
        console.error("[AuthService] getVkToken - Error:", error.message);
      }
      throw error;
    }
  }


  async getUserDataFromVk(userId: string, token: string): Promise<any> {
    return this.http
      .get(
        `https://api.vk.com/method/users.get?user_ids=${userId}&fields=photo_400,has_mobile,home_town,contacts,mobile_phone&access_token=${token}&v=5.120`
      )
      .toPromise();
  }
}
