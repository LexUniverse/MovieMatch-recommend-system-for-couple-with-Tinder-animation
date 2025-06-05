import React, { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import TinderCard from "react-tinder-card";
import { toast } from "react-toastify";
import "./RoomModal.css";

interface RoomModalProps {
    room: any;
    currentUserId: number;
    onClose: () => void;
    onReadyChange: (userId: number, ready: boolean) => void;
}

const socket: Socket = io("http://localhost:3001");

function useIsMobile() {
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth <= 768);
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);
    return isMobile;
}

const RoomModal: React.FC<RoomModalProps> = ({
                                                 room,
                                                 currentUserId,
                                                 onClose,
                                                 onReadyChange,
                                             }) => {
    const [roomState, setRoomState] = useState<any>(room);
    const [ready, setReady] = useState(false);
    const [hasVoted, setHasVoted] = useState(false);
    const [recommendations, setRecommendations] = useState<any[]>([]);
    const [currentIndex, setCurrentIndex] = useState<number>(-1);
    const [selectedFilm, setSelectedFilm] = useState<any>(null);
    const [hasMatch, setHasMatch] = useState(false);
    const [posterLoading, setPosterLoading] = useState(true);
    const [selectedPosterLoading, setSelectedPosterLoading] = useState(true);
    const isMobile = useIsMobile();

    const recommendationsRef = useRef<any[]>([]);
    recommendationsRef.current = recommendations;

    useEffect(() => {
        socket.emit("joinRoom", { roomId: room.id, userId: currentUserId });

        socket.on("roomData", (updatedRoom) => setRoomState(updatedRoom));

        socket.on("recommendationsList", (films: any[]) => {
            setRecommendations(films);
            setCurrentIndex(0);
            setHasVoted(false);
            setSelectedFilm(null);
            setPosterLoading(true);
        });

        socket.on("choicesResult", ({ match, film }) => {
            setSelectedFilm(film);
            if (match) {
                setHasMatch(true);
            }
        });

        socket.on("startRecommendations", (film) => {
            const idx = recommendationsRef.current.findIndex(
                (f) => f.film_id === film.film_id
            );
            setCurrentIndex(idx !== -1 ? idx : 0);
            setHasVoted(false);
            setSelectedFilm(null);
            setPosterLoading(true);
        });

        socket.on("nextFilm", () => {
            setPosterLoading(true);
            setSelectedPosterLoading(true);
            setSelectedFilm(null);
            setHasVoted(false);
            setCurrentIndex((i) => {
                const nextIndex = i + 1;
                if (nextIndex < recommendationsRef.current.length) {
                    return nextIndex;
                } else {
                    toast.info("Фильмы закончились. Начните заново.");
                    return -1;
                }
            });
        });

        return () => {
            socket.off("roomData");
            socket.off("recommendationsList");
            socket.off("startRecommendations");
            socket.off("nextFilm");
        };
    }, [room.id, currentUserId]);

    const handleReady = () => {
        socket.emit("setReady", { roomId: room.id, userId: currentUserId });
        setReady(true);
        onReadyChange(currentUserId, true);
    };

    const vote = (choice: boolean) => {
        if (hasVoted || currentIndex === -1 || selectedFilm) return;
        socket.emit("makeChoice", {
            roomId: room.id,
            userId: currentUserId,
            choice,
        });
        setHasVoted(true);
        setSelectedFilm(recommendations[currentIndex]);
        setSelectedPosterLoading(true);
    };

    const currentFilm =
        currentIndex !== -1 && recommendations[currentIndex]
            ? recommendations[currentIndex]
            : null;

    const onSwipe = (direction: string) => {
        if (hasVoted || selectedFilm) return;
        if (direction === "right") vote(true);
        else if (direction === "left") vote(false);
    };

    return (
        <div className="modal-overlay">
            <div className="modal" style={{ color: "#fff" }}>
                <button
                    onClick={onClose}
                    className="modal-close-button"
                    aria-label="Закрыть"
                >
                    ×
                </button>

                <div className="room-code">Код подключения: {room.id}</div>

                <div className="users-list">
                    {roomState.users?.map((user: any) => (
                        <div
                            key={user.userId}
                            className={`user-item ${user.ready ? "ready" : "not-ready"}`}
                        >
                            <img
                                src={user.avatar_url}
                                alt={user.name}
                                width={32}
                                height={32}
                                className="user-avatar"
                            />
                            {user.name} {user.ready ? "✅" : "❌"}
                        </div>
                    ))}
                </div>

                {!ready && (
                    <button className="ready-button" onClick={handleReady}>
                        Я готов
                    </button>
                )}

                {currentFilm ? (
                    <>
                        {!isMobile && !selectedFilm && (
                            <div className="film-container">
                                <h2>{currentFilm.title_ru || currentFilm.title_en}</h2>
                                <div className="film-year">{currentFilm.year}</div>
                                {!hasMatch && posterLoading && <div className="spinner"></div>}
                                <img
                                    src={currentFilm.poster_url}
                                    alt={currentFilm.title_en}
                                    className="film-poster"
                                    draggable={false}
                                    onLoad={() => setPosterLoading(false)}
                                />
                                <div className="vote-buttons">
                                    <button
                                        onClick={() => vote(false)}
                                        disabled={hasVoted}
                                        aria-label="Не нравится"
                                        className="dislike-button"
                                    >
                                        👎
                                    </button>
                                    <button
                                        onClick={() => vote(true)}
                                        disabled={hasVoted}
                                        aria-label="Нравится"
                                        className="like-button"
                                    >
                                        👍
                                    </button>
                                </div>
                            </div>
                        )}

                        {isMobile && !selectedFilm && (
                            <TinderCard
                                key={currentFilm.film_id}
                                onSwipe={onSwipe}
                                preventSwipe={["up", "down"]}
                            >
                                <div className="film-container film-mobile">
                                    <h2>{currentFilm.title_ru || currentFilm.title_en}</h2>
                                    <div className="film-year">{currentFilm.year}</div>
                                    {!hasMatch && posterLoading && <div className="spinner"></div>}
                                    <img
                                        src={currentFilm.poster_url}
                                        alt={currentFilm.title_en}
                                        className="film-poster"
                                        draggable={false}
                                        onLoad={() => setPosterLoading(false)}
                                    />
                                    <div className="vote-buttons">
                                        <button
                                            onClick={() => vote(false)}
                                            disabled={hasVoted}
                                            aria-label="Не нравится"
                                            className="dislike-button"
                                        >
                                            👎
                                        </button>
                                        <button
                                            onClick={() => vote(true)}
                                            disabled={hasVoted}
                                            aria-label="Нравится"
                                            className="like-button"
                                        >
                                            👍
                                        </button>
                                    </div>
                                </div>
                                <div className="swipe-hint">
                                    <p>Вправо — 👍, влево — 👎</p>
                                </div>
                            </TinderCard>
                        )}

                        {selectedFilm && (
                            <div className="selected-film">
                                <h3>
                                    {hasMatch ? "Вы выбрали фильм!" : "Вы оценили фильм"}
                                </h3>
                                <h2>{selectedFilm.title_ru || selectedFilm.title_en}</h2>
                                <div className="film-year">{selectedFilm.year}</div>
                                {selectedPosterLoading && <div className="spinner"></div>}
                                <img
                                    src={selectedFilm.poster_url}
                                    alt={selectedFilm.title_en}
                                    className="film-poster-selected"
                                    draggable={false}
                                    onLoad={() => setSelectedPosterLoading(false)}
                                />
                                {hasMatch ? (
                                    <p className="waiting-text match-text">У вас метч! 🎉</p>
                                ) : (
                                    <p className="waiting-text">Ждем следующего фильма...</p>
                                )}
                            </div>
                        )}
                    </>
                ) : (
                    <div className="waiting-text">
                        {ready ? "Рекомендации ещё не загружены или закончились." : "Ожидайте рекомендации..."}
                    </div>
                )}
            </div>
        </div>
    );
};

export default RoomModal;
