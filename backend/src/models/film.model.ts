import { IsString, IsNumber, IsOptional, IsArray } from "class-validator";

export class FilmModel {
    @IsString()
    title: string;

    @IsNumber()
    @IsOptional()
    year?: number;

    @IsArray()
    @IsNumber({}, { each: true })
    genreIds: number[];
}

export class FilmDTO {
    id: number;
    title: string;
    year: number;
    genres: { id: number; name: string }[];
}
