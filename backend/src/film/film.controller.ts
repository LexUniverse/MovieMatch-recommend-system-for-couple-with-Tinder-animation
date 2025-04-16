import { Controller, Post, Body, ValidationPipe, Get, Param, NotFoundException } from "@nestjs/common";
import { FilmModel } from "../models";
import { FilmEntity } from "../entities";
import { FilmService } from "./film.service";

@Controller("films")
export class FilmController {
    constructor(private readonly filmService: FilmService) {}

    @Get("/:id")
    async getFilmById(@Param("id") id: number): Promise<FilmEntity> {
        const film = await this.filmService.findById(id);
        if (!film) throw new NotFoundException();
        return film;
    }

    @Get()
    async getAllFilms(): Promise<FilmEntity[]> {
        return await this.filmService.findAll();
    }

    @Post()
    async addFilm(@Body(new ValidationPipe()) filmModel: FilmModel): Promise<FilmEntity> {
        return await this.filmService.create(filmModel);
    }
}
