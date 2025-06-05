import React, { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useStores } from "stores/useStores";
import { IUser } from "stores/UserStore";
import LayoutDefault from "components/LayoutDefault";
import "./home.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import star from "../../static/star.png";
import invite from "../../static/invite.png";
import choose from "../../static/like.png";
import PreferencesModal from "../../components/modal/preferences/PreferencesModal";
import RoomModal from "../../components/rooms/RoomModal";


const HomePage = observer(() => {
    const [showModal, setShowModal] = useState(false);
    const user: IUser = useStores()["UserStore"].user;
    const [recommendations, setRecommendations] = useState<any[]>([]);
    const [showRoomModal, setShowRoomModal] = useState(false);
    const [activeRoom, setActiveRoom] = useState<any | null>(null);
    const [showJoinRoomModal, setShowJoinRoomModal] = useState(false);
    const [joinRoomId, setJoinRoomId] = useState("");
    const [posterLoading, setPosterLoading] = useState(true);

    useEffect(() => {
        if (user?.id) {
            fetch(`http://localhost:8888/users/${user.id}/recommendations`)
                .then((res) => res.json())
                .then(setRecommendations)
                .catch(console.error);
        }
    }, [user]);

    const handleInviteClick = async () => {
        try {
            await navigator.clipboard.writeText(window.location.origin);
            toast.success("Ссылка скопирована!", {
                style: {
                    backgroundColor: "black",
                },
            });
        } catch (e) {
            toast.error("Не удалось скопировать ссылку");
        }
    };

    const onRoomCreatedOrJoined = (room: any) => {
        setActiveRoom(room);
        setShowRoomModal(true);
    };

    const createRoom = async () => {
        if (!user?.id) return;

        try {
            const res = await fetch("http://localhost:8888/rooms", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: `Комната пользователя ${user.id}`,
                    userIds: [user.id],
                }),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => null);
                throw new Error(err?.message || "Ошибка создания комнаты");
            }

            const room = await res.json();
            toast.success("Комната создана");
            onRoomCreatedOrJoined(room);
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Неизвестная ошибка");
        }
    };

    const handleJoinRoomConfirm = async () => {
        if (joinRoomId && user?.id) {
            try {
                const res = await fetch(`http://localhost:8888/rooms/${joinRoomId}`);
                if (!res.ok) throw new Error("Комната не найдена");
                const room = await res.json();

                const userIds = room.users?.map((u: any) => u.id);
                if (!userIds.includes(user.id)) {
                    const patchRes = await fetch(`http://localhost:8888/rooms/${joinRoomId}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ userIds: [...userIds, user.id] }),
                    });
                    if (!patchRes.ok) throw new Error("Ошибка присоединения к комнате");
                    const updatedRoom = await patchRes.json();
                    setActiveRoom(updatedRoom);
                } else {
                    setActiveRoom(room);
                }

                setShowRoomModal(true);
                setShowJoinRoomModal(false);
                setJoinRoomId("");
            } catch (e) {
                toast.error(e instanceof Error ? e.message : "Неизвестная ошибка");
            }
        }
    };

    return (
        <div>
            <header>
                <LayoutDefault />
            </header>

            <div className="topsection">
                <div className="topsection-content">
                    <div className="main-img-text">
                        <h1>
                            Выбор фильма — <br />
                            больше не <br />
                            проблема
                        </h1>
                    </div>
                    <div className="small-img-text">
                        Наша система учитывает вкусы обоих<br />
                        и предлагает идеальный вариант
                    </div>
                    <a className="main-btn" href="#hiw">
                        Попробовать вместе
                    </a>
                </div>
            </div>

            <div id="hiw" className="how-it-works">
                <div className={"section-title"}>Как работает</div>
                <div className="hiw-btn-wrapper">
                    <div className="hiw-btn">
                        <div className={"hiw-btn-inside"}>
                            <div className={"div1"}>
                                <img src={star} alt={"star"} className="hiw-icon" />
                            </div>
                            <div className={"div2"} onClick={() => setShowModal(true)}>
                                Введите предпочтения
                            </div>

                            {showModal && (
                                <PreferencesModal userId={user?.id} onClose={() => setShowModal(false)} />
                            )}
                        </div>
                    </div>
                    <div className="hiw-btn" onClick={handleInviteClick}>
                        <div className={"hiw-btn-inside"}>
                            <div className={"div1"}>
                                <img src={invite} alt={"2guys"} className="hiw-icon" />
                            </div>
                            <div className={"div2"}>Пригласите партнёра</div>
                        </div>
                    </div>
                    <a href="#room" className="hiw-btn">
                        <div className={"hiw-btn-inside"}>
                            <div className={"div1"}>
                                <img src={choose} alt={"choose"} className="hiw-icon" />
                            </div>
                            <div className={"div2"}>Выберите фильм</div>
                        </div>
                    </a>
                </div>
            </div>

            <ToastContainer position="bottom-right" autoClose={3000} />

            {user && recommendations.length > 0 && (
                <div className="how-it-works recommendation-section">
                    <div className="section-title">Рекомендации для вас</div>
                    <div className="recommendation-scroll">
                        {recommendations.map((rec) => (
                            <div key={rec.film_id} className="recommendation-item">
                                {posterLoading && <div className="spinner"></div>}
                                <img
                                    src={`http://localhost:5000/get_movie_poster/${rec.film_id}`}
                                    alt={rec.title_ru}
                                    onLoad={() => setPosterLoading(false)}
                                />
                                <div className="recommendation-title">{rec.title_ru}</div>
                                <div className="recommendation-year">{rec.year}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div id="room" className="room-section">
                <div className={"section-title"}>Выберите фильм</div>
                    <div className="room-btn-wrapper">
                    <div className="room-btn" onClick={createRoom}>
                        Создать комнату
                    </div>

                    <div className="room-btn" onClick={() => setShowJoinRoomModal(true)}>
                        Присоединиться
                    </div>
                </div>

                {showRoomModal && activeRoom && user?.id && (
                    <RoomModal
                        room={activeRoom}
                        currentUserId={user.id}
                        onClose={() => setShowRoomModal(false)}
                        onReadyChange={(id, ready) => {}}
                    />
                )}
            </div>

            {showJoinRoomModal && (
                <div className="overlay">
                    <div className="modal-come">
                        <h2>Войти в комнату</h2>
                        <input
                            type="text"
                            placeholder="Введите ID комнаты"
                            value={joinRoomId}
                            onChange={(e) => setJoinRoomId(e.target.value)}
                        />
                        <div className="modal-buttons">
                            <button onClick={() => setShowJoinRoomModal(false)}>Отмена</button>
                            <button onClick={handleJoinRoomConfirm}>Присоединиться</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});

export default HomePage;