import React, { useEffect, useState } from "react";
import "./PreferencesModal.css";

const PreferencesModal = ({ userId, onClose }) => {
    const [movies, setMovies] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [rating, setRating] = useState<number | null>(null);
    const [watchedMovies, setWatchedMovies] = useState([]);

    useEffect(() => {
        fetchPopularMovies();
    }, []);

    const fetchPopularMovies = async () => {
        const response = await fetch("http://localhost:8000/recommendations/popular", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(watchedMovies),
        });
        const data = await response.json();
        setMovies(data);
    };

    const handleWatched = async () => {
        if (rating === null || !movies[currentIndex]) return;

        const film = movies[currentIndex];
        const payload = {
            userId,
            filmId: film.film_id,
            rating,
        };

        await fetch("http://localhost:8888/preferences", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        // обновляем список просмотренных и переход к следующему
        const updatedWatched = [...watchedMovies, { film_id: film.film_id, rating }];
        setWatchedMovies(updatedWatched);
        setRating(null);
        setCurrentIndex((i) => i + 1);
    };

    const handleSkip = () => {
        setCurrentIndex((i) => i + 1);
        setRating(null);
    };

    const currentMovie = movies[currentIndex];

    if (!currentMovie) return (
        <div className="modal-overlay">
            <div className="modal-content">
                <p>Фильмы закончились 🎉</p>
                <button onClick={onClose}>Закрыть</button>
            </div>
        </div>
    );

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2 className={"recomend-title"}>{currentMovie.title_ru}</h2>
                <img
                    src={`http://localhost:5000/get_movie_poster/${currentMovie.film_id}`}
                    alt={currentMovie.title_ru}
                    className="modal-poster"
                />
                <div className="rating-buttons">
                    {[1, 2, 3, 4, 5].map((val) => (
                        <button
                            key={val}
                            onClick={() => setRating(val)}
                            className={rating === val ? "active" : ""}
                        >
                            {val}
                        </button>
                    ))}
                </div>
                <div className="modal-actions">
                    <button onClick={handleSkip}>Не смотрел</button>
                    <button onClick={handleWatched} disabled={rating === null}>
                        Смотрел
                    </button>
                </div>
                <button className="close-btn" onClick={onClose}>×</button>
            </div>
        </div>
    );
};

export default PreferencesModal;
