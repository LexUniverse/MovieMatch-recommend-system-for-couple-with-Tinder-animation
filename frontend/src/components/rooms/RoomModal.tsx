import React, { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { toast } from "react-toastify";
import "./RoomModal.css";

interface RoomModalProps {
    room: any;
    currentUserId: number;
    onClose: () => void;
    onReadyChange: (userId: number, ready: boolean) => void;
}

const socket: Socket = io("http://localhost:3001");

const RoomModal: React.FC<RoomModalProps> = ({ room, currentUserId, onClose, onReadyChange }) => {
    const [currentFilm, setCurrentFilm] = useState<any>(null);
    const [roomState, setRoomState] = useState<any>(room);
    const [ready, setReady] = useState(false);
    const [hasVoted, setHasVoted] = useState(false);
    const [currentUserInfo, setCurrentUserInfo] = useState<any>(null);

    const fetchRoom = async () => {
        try {
            const res = await fetch(`http://localhost:8888/rooms/${room.id}`);
            const data = await res.json();
            setRoomState(data);
            const user = data.users.find((u: any) => u.id === currentUserId);
            if (user) {
                setCurrentUserInfo(user);
            }
        } catch (err) {
            toast.error("Не удалось загрузить информацию о комнате");
        }
    };

    useEffect(() => {
        socket.emit("joinRoom", { roomId: room.id, userId: currentUserId });
        fetchRoom();

        socket.on("roomData", updatedRoom => {
            setRoomState(updatedRoom);
            const user = updatedRoom.users.find((u: any) => u.id === currentUserId);
            if (user) {
                setCurrentUserInfo(user);
            } else {
                fetchRoom(); // если не нашли пользователя — обновим снова
            }
        });

        socket.on("startRecommendations", film => {
            setCurrentFilm(film);
            setHasVoted(false);
        });

        socket.on("choicesResult", ({ match, film }) => {
            if (match) {
                toast.success(`Совпадение! Вы выбрали: ${film?.title_ru || film?.title || 'фильм'}`);
            } else {
                toast.info("Нет совпадения. Следующий фильм...");
            }
        });

        socket.on("endRecommendations", () => {
            toast.info("Фильмы закончились. Начните заново.");
            setCurrentFilm(null);
            setReady(false);
            setHasVoted(false);
        });

        return () => {
            socket.off("roomData");
            socket.off("startRecommendations");
            socket.off("choicesResult");
            socket.off("endRecommendations");
        };
    }, [room.id, currentUserId]);

    useEffect(() => {
        const allReady = roomState.users?.every((u: any) => u.ready);
        if (allReady && roomState.users?.length > 1) {
            fetch(`http://localhost:8888/rooms/${room.id}/recommendations`)
                .then(res => res.json())
                .then(data => {
                    toast.success("Рекомендации загружены");
                    socket.emit("sendRecommendations", { roomId: room.id, recommendations: data });
                })
                .catch(() => toast.error("Ошибка загрузки рекомендаций"));
        }
    }, [roomState, room.id]);

    const handleReady = () => {
        socket.emit("setReady", { roomId: room.id, userId: currentUserId });
        setReady(true);
        onReadyChange(currentUserId, true);
    };

    const vote = (choice: boolean) => {
        if (hasVoted || !currentFilm) return;
        socket.emit("makeChoice", { roomId: room.id, userId: currentUserId, choice });
        setHasVoted(true);
    };

    return (
        <div className="modal-overlay">
            <div className="modal"
                 style={{background: "#1c1c1c", color: "#fff", borderRadius: 12, padding: 20, maxWidth: 400}}>

                <h2 style={{marginTop: 0}}>Комната {roomState.name}</h2>
                <h3>Код: {roomState.id}</h3>

                {currentUserInfo && (
                    <div style={{display: "flex", alignItems: "center", marginBottom: 20}}>
                        <img
                            src={currentUserInfo.avatar_url || "https://via.placeholder.com/32"}
                            alt={currentUserInfo.name}
                            style={{width: 40, height: 40, borderRadius: "50%", marginRight: 12}}
                        />
                        <span>Вы: <strong>{currentUserInfo.name}</strong></span>
                    </div>
                )}

                {!ready &&
                    <button onClick={handleReady} style={{padding: "8px 16px", cursor: "pointer"}}>Я готов</button>}

                {ready && currentFilm && (
                    <div style={{textAlign: "center", marginTop: 20}}>
                        <h3>{currentFilm.title_ru || currentFilm.title}</h3>
                        <img
                            src={`http://localhost:5000/get_movie_poster/${currentFilm.film_id}`}
                            alt={currentFilm.title_ru}
                            style={{
                                width: "80%",                  // ширина адаптивна, от размера модалки
                                maxWidth: 400,                 // но не больше 300px
                                height: "auto",                // сохраняем пропорции
                                borderRadius: 12,
                                margin: "20px auto",
                                display: "block",              // чтобы центрировать
                                objectFit: "cover",
                                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
                            }}
                        />
                        <div>{currentFilm.year}</div>
                        <div style={{marginTop: 10}}>
                            <button onClick={() => vote(true)} disabled={hasVoted}
                                    style={{marginRight: 10, cursor: hasVoted ? "not-allowed" : "pointer"}}>
                                👍
                            </button>
                            <button onClick={() => vote(false)} disabled={hasVoted}
                                    style={{cursor: hasVoted ? "not-allowed" : "pointer"}}>
                                👎
                            </button>
                        </div>
                    </div>
                )}

                <div style={{marginTop: 30}}>
                    <h4>Участники:</h4>
                    <ul style={{listStyle: "none", padding: 0}}>
                        {roomState.users?.map((u: any) => (
                            <li
                                key={u.id}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    marginBottom: 10,
                                    backgroundColor: "#333",
                                    padding: "5px 10px",
                                    borderRadius: 8
                                }}
                            >
                                <img
                                    src={u.avatar_url || "https://via.placeholder.com/32"}
                                    alt={u.name || `Пользователь #${u.id}`}
                                    style={{width: 32, height: 32, borderRadius: "50%", marginRight: 12}}
                                />
                                <span>{u.name || `Пользователь #${u.id}`}</span>
                                <span style={{
                                    marginLeft: "auto",
                                    fontStyle: "italic",
                                    color: u.ready ? "limegreen" : "gray"
                                }}>
                                    {u.ready ? "Готов" : "Ожидает"} {u.choice !== null ? "(Проголосовал)" : ""}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
                <button onClick={onClose} style={{
                    float: "right",
                    background: "transparent",
                    border: "none",
                    fontSize: 24,
                    color: "#fff",
                    cursor: "pointer"
                }}>
                    ×
                </button>
            </div>
        </div>
    );
};

export default RoomModal;
