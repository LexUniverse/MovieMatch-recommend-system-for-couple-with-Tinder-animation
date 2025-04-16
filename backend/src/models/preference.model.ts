import { IsNumber } from "class-validator";

export class PreferenceModel {
    @IsNumber()
    userId: number;

    @IsNumber()
    filmId: number;

    @IsNumber()
    rating: number;
}

export class PreferenceDTO {
    id: number;
    userId: number;
    filmId: number;
    rating: number;
}
