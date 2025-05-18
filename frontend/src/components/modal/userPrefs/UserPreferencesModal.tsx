import React, { useEffect, useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import './UserPreferencesModal.css'; // создай файл стилей или используй Tailwind

interface Props {
    userId: number;
    onClose: () => void;
}

interface Preference {
    id: number;
    rating: number;
    film: {
        id: number;
        title: string;
        russian_title: string;
        year: number;
    };
}

const UserPreferencesModal: React.FC<Props> = ({ userId, onClose }) => {
    const [preferences, setPreferences] = useState<Preference[]>([]);

    useEffect(() => {
        fetch(`http://localhost:8888/preferences/user/${userId}`)
            .then(async (res) => {
                if (!res.ok) throw new Error();
                const data = await res.json();
                setPreferences(data);
            })
            .catch(() => toast.error('Ошибка загрузки предпочтений'));
    }, [userId]);

    const handleRatingChange = (id: number, newRating: number) => {
        const pref = preferences.find(p => p.id === id);
        if (!pref) return;

        fetch(`http://localhost:8888/preferences/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId,
                filmId: pref.film.id,
                rating: newRating
            }),
        })
            .then(res => {
                if (!res.ok) throw new Error();
                toast.success('Рейтинг обновлён');
                setPreferences(prev =>
                    prev.map(p => p.id === id ? { ...p, rating: newRating } : p)
                );
            })
            .catch(() => toast.error('Ошибка обновления'));
    };

    const handleDelete = (id: number) => {
        fetch(`http://localhost:8888/preferences/${id}`, {
            method: 'DELETE',
        })
            .then(res => {
                if (!res.ok) throw new Error();
                toast.success('Предпочтение удалено');
                setPreferences(prev => prev.filter(p => p.id !== id));
            })
            .catch(() => toast.error('Ошибка удаления'));
    };

    return (
        <div className="upm-overlay">
            <div className="upm-modal">
                <button className="upm-close-btn" onClick={onClose}>×</button>
                <h2 className="upm-title">Мои предпочтения</h2>

                <div className="upm-preference-grid">
                    {preferences.map(pref => (
                        <div key={pref.id} className="upm-preference-card">
                            <img
                                src={`http://localhost:5000/get_movie_poster/${pref.film.id}`}
                                alt={pref.film.russian_title || pref.film.title}
                            />
                            <div className="upm-card-info">
                                <div className="upm-card-title">
                                    {pref.film.russian_title || pref.film.title}
                                </div>
                                <div className="upm-card-year">{pref.film.year}</div>

                                <div className="upm-rating-buttons">
                                    {[1, 2, 3, 4, 5].map((val) => (
                                        <button
                                            key={val}
                                            onClick={() => handleRatingChange(pref.id, val)}
                                            className={pref.rating === val ? "active" : ""}
                                        >
                                            {val}
                                        </button>
                                    ))}
                                </div>

                                <button className="upm-delete-btn" onClick={() => handleDelete(pref.id)}>
                                    Удалить
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
};

export default UserPreferencesModal;
