import { IsString, IsArray, IsNumber } from "class-validator";

export class RoomModel {
    @IsString()
    name: string;

    @IsArray()
    @IsNumber({}, { each: true })
    userIds: number[];
}

export class RoomDTO {
    id: number;
    name: string;
    users: {
        id: number;
        name: string;
        email: string;
        avatar_url: string;
    }[];
}
