import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server, Socket } from 'socket.io';
import fetch from 'node-fetch'; // npm install node-fetch

interface DbUser {
    id: number;
    created: string;
    updated: string;
    vk_id: number;
    name: string;
    email: string;
    grant: number;
    avatar_url: string;
}

interface DbRoom {
    id: number;
    created: string;
    updated: string;
    name: string;
    users: DbUser[];
}

interface UserState {
    userId: number;
    ready: boolean;
    choice: boolean | null;
}

interface MergedUser extends UserState {
    name: string;
    avatar_url: string;
}

interface RoomState {
    users: UserState[];
    recommendations: any[];
    currentIndex: number;
}

interface RoomPayload {
    users: MergedUser[];
    recommendations: any[];
    currentIndex: number;
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: '*' }
});

const rooms = new Map<string, RoomState>();

async function buildRoomPayload(roomId: string): Promise<RoomPayload | null> {
    const state = rooms.get(roomId);
    if (!state) return null;

    try {
        const res = await fetch(`http://localhost:8888/rooms/${roomId}`);
        if (!res.ok) {
            console.error(`[buildRoomPayload] Ошибка при GET /rooms/${roomId}:`, res.status);
            return null;
        }

        const dbRoom = (await res.json()) as DbRoom;

        const mergedUsers: MergedUser[] = dbRoom.users.map(dbUser => {
            const userState = state.users.find(u => u.userId === dbUser.id);
            return {
                userId: dbUser.id,
                name: dbUser.name,
                avatar_url: dbUser.avatar_url,
                ready: userState?.ready ?? false,
                choice: userState?.choice ?? null,
            };
        });

        return {
            users: mergedUsers,
            recommendations: state.recommendations,
            currentIndex: state.currentIndex,
        };
    } catch (err) {
        console.error(`[buildRoomPayload] fetch error:`, err);
        return null;
    }
}

io.on('connection', (socket: Socket) => {
    console.log(`[socket] User connected: ${socket.id}`);

    socket.on('joinRoom', async ({ roomId, userId }) => {
        console.log(`[joinRoom] roomId=${roomId}, userId=${userId}`);
        socket.join(roomId);

        let room = rooms.get(roomId);
        if (!room) {
            room = { users: [], recommendations: [], currentIndex: 0 };
            rooms.set(roomId, room);
            console.log(`[newRoom] Created new room ${roomId}`);
        }

        if (!room.users.find(u => u.userId === userId)) {
            room.users.push({ userId, ready: false, choice: null });
            console.log(`[userAdded] User ${userId} added to room ${roomId}`);
        }

        const payload = await buildRoomPayload(roomId);
        if (payload) {
            io.to(roomId).emit('roomData', payload);
            console.log(`[emit] roomData to room ${roomId}`, payload);
        }
    });

    socket.on('setReady', async ({ roomId, userId }) => {
        console.log(`[setReady] roomId=${roomId}, userId=${userId}`);
        const room = rooms.get(roomId);
        if (!room) return;

        const user = room.users.find(u => u.userId === userId);
        if (user) user.ready = true;

        // Проверяем, все ли игроки готовы
        const allReady = room.users.length > 1 && room.users.every(u => u.ready);
        console.log(`[setReady] Проверка всех готовых: ${allReady}`);

        if (allReady && room.recommendations.length === 0) {
            try {
                const res = await fetch(`http://localhost:8888/rooms/${roomId}/recommendations`);
                if (!res.ok) {
                    console.error(`[setReady] Ошибка при загрузке рекомендаций:`, res.status);
                    return;
                }
                const recommendations = await res.json() as any[];
                console.log(`[setReady] Рекомендации загружены:`, recommendations);

                room.recommendations = recommendations;
                room.currentIndex = 0;

                io.to(roomId).emit('recommendationsList', recommendations); // Отправляем весь список
                io.to(roomId).emit('startRecommendations', recommendations[0]); // Начинаем с первого фильма
            } catch (err) {
                console.error(`[setReady] Ошибка при fetch рекомендаций:`, err);
            }
        }

        const payload = await buildRoomPayload(roomId);
        if (payload) {
            io.to(roomId).emit('roomData', payload);
        }
    });

    socket.on('makeChoice', async ({ roomId, userId, choice }) => {
        const room = rooms.get(roomId);
        if (!room) return;

        const user = room.users.find(u => u.userId === userId);
        if (user) user.choice = choice;

        if (room.users.every(u => u.choice !== null)) {
            const allChoices = room.users.map(u => u.choice);
            const match = allChoices.every(c => c === true);

            const film = room.recommendations[room.currentIndex];
            io.to(roomId).emit('choicesResult', { match, film });

            if (match) {
                room.users.forEach(u => {
                    u.ready = false;
                    u.choice = null;
                });
                room.recommendations = [];
                room.currentIndex = 0;
            } else {
                room.currentIndex++;
                room.users.forEach(u => u.choice = null);

                if (room.currentIndex < room.recommendations.length) {
                    io.to(roomId).emit('startRecommendations', room.recommendations[room.currentIndex]);
                } else {
                    io.to(roomId).emit('endRecommendations');
                    room.users.forEach(u => {
                        u.ready = false;
                        u.choice = null;
                    });
                    room.recommendations = [];
                    room.currentIndex = 0;
                }
            }
        }
    });

    socket.on('disconnect', () => {
        console.log(`[socket] User disconnected: ${socket.id}`);
    });
});

const PORT = 3001;
server.listen(PORT, () => {
    console.log(`🟢 Real-time service listening on port ${PORT}`);
});
