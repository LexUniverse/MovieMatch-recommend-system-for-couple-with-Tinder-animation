// socket-server.ts
import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server, Socket } from 'socket.io';
import fetch from 'node-fetch'; // npm install node-fetch

interface User {
    userId: number;
    ready: boolean;
    choice: boolean | null;
}

interface Room {
    users: User[];
    recommendations: any[];
    currentIndex: number;
}

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: { origin: '*' }
});

const rooms = new Map<string, Room>();

io.on('connection', (socket: Socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on('joinRoom', ({ roomId, userId }) => {
        socket.join(roomId);

        let room = rooms.get(roomId);
        if (!room) {
            room = {
                users: [],
                recommendations: [],
                currentIndex: 0,
            };
            rooms.set(roomId, room);
        }

        if (!room.users.find(u => u.userId === userId)) {
            room.users.push({ userId, ready: false, choice: null });
        }

        io.to(roomId).emit('roomData', room);
        console.log(`User ${userId} joined room ${roomId}`);
    });

    socket.on('setReady', async ({ roomId, userId }) => {
        const room = rooms.get(roomId);
        if (!room) return;

        const user = room.users.find(u => u.userId === userId);
        if (user) {
            user.ready = true;
        }

        io.to(roomId).emit('roomData', room);

    });

    socket.on('sendRecommendations', ({ roomId, recommendations }) => {
        const room = rooms.get(roomId);
        if (!room) return;

        room.recommendations = recommendations;
        room.currentIndex = 0;

        console.log(`Получены ${recommendations.length} рекомендаций для комнаты ${roomId}`);
        io.to(roomId).emit('startRecommendations', room.recommendations[room.currentIndex]);
    });

    socket.on('makeChoice', ({ roomId, userId, choice }) => {
        const room = rooms.get(roomId);
        if (!room) return;

        const user = room.users.find(u => u.userId === userId);
        if (user) {
            user.choice = choice;
        }

        if (room.users.every(u => u.choice !== null)) {
            const allChoices = room.users.map(u => u.choice);
            const match = allChoices.every(c => c === true);

            io.to(roomId).emit('choicesResult', { match, film: room.recommendations[room.currentIndex] });

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
        console.log(`User disconnected: ${socket.id}`);
        // Доп. очистка — по желанию
    });
});

const PORT = 3001;
server.listen(PORT, () => {
    console.log(`Real-time service listening on port ${PORT}`);
});
