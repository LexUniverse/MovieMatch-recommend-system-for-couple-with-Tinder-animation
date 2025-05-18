// VKShutter.tsx
import React from "react";
import "./VKShutter.css";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    user: {
        avatar_url: string;
        name: string;
    };
    onLogout: () => void;
    onOpenPreferences: () => void; // 👈 Новый пропс
}

const VKShutter: React.FC<Props> = ({ isOpen, onClose, user, onLogout, onOpenPreferences  }) => {
    return (
        <div
            className={`shutter-overlay ${isOpen ? "open" : ""}`}
            onClick={onClose}
        >
            <div className="shutter-panel" onClick={(e) => e.stopPropagation()}>
                <div className="shutter-header">
                    <img src={user.avatar_url} alt="avatar" className="shutter-avatar" />
                    <span className="shutter-name">{user.name}</span>
                </div>
                <div className="shutter-actions">
                    <button className="shutter-button"   onClick={() => {
                        onOpenPreferences();
                        onClose(); // чтобы закрыть шторку при открытии модального окна (если нужно)
                    }}>Мои предпочтения</button>

                    <button className="shutter-button" onClick={onLogout}>
                        Выйти
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VKShutter;
