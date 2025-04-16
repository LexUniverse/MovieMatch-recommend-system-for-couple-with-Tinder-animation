import { IsString } from "class-validator";

export class GenreModel {
    @IsString()
    name: string;
}

export class GenreDTO {
    id: number;
    name: string;
}
