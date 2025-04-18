import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { FilmService } from '../film';
import { GenreService } from '../genre';
import * as fs from 'fs';
import * as csv from 'csv-parser';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const filmService = app.get(FilmService);
    const genreService = app.get(GenreService);

    const results = [];

    fs.createReadStream(__dirname + '/films.csv')
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
            for (const row of results) {
                const genres = row.genres.split('|').filter(g => g !== '(no genres listed)');
                const genreEntities = [];

                for (const genreName of genres) {
                    let genre = await genreService.findByName(genreName);
                    if (!genre) {
                        genre = await genreService.create({ name: genreName });
                        console.log(`➕ Genre created: ${genreName}`);
                    }
                    genreEntities.push(genre);
                }

                const existingFilm = await filmService.findByTitle(row.title);
                if (!existingFilm) {
                    await filmService.create({
                        title: row.title,
                        year: parseInt(row.year) || null,
                        genreIds: genreEntities.map(g => g.id)
                    });
                    console.log(`✅ Film added: ${row.title}`);
                } else {
                    console.log(`⚠️ Already exists: ${row.title}`);
                }
            }

            console.log('🎬 Import finished!');
            await app.close();
        });
}

bootstrap();
