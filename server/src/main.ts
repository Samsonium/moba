import { Server, Socket } from 'socket.io';
import { ClientEvents } from './ClientEvents';
import { ServerEvents } from './ServerEvents';
import { SocketData } from './SocketData';

const server = new Server<ClientEvents, ServerEvents, any, SocketData>({
    cors: {
        origin: true
    },
    allowUpgrades: true
});

const players: Record<string, SocketData & {socket: Socket}> = {};

server.on('connect', (socket) => {
    console.log(`Socket ${socket.id} connected`)

    // Generate ID
    const id = 'xxxx-xxxx'.replace(/x/g,
        () => Math.floor(Math.random() * 16).toString(16));

    // Init socket data
    socket.data = {
        id,
        nick: '',
        hp: 100,
        mp: 100,
        position: {
            x: 0,
            y: 0,
            z: 0
        },
        rotation: 0,
    };

    // Player display name get event
    socket.on('expose', (name) => {
        if (players[id])
            return;

        socket.data.nick = name;
        players[id] = {
            socket,
            ...socket.data
        };

        socket.emit('exposeEnd', socket.data.id);
    });

    // Player incoming update event
    socket.on('playerUpdate', (player) => {
        if (!players[id]) return;
        players[id] = {
            ...players[id],
            ...player
        };
    });

    // Disconnect event
    socket.on('disconnect', () => {
        if (!players[id]) return;
        delete players[id];
    });
});

setInterval(() => {
    if (!Object.keys(players).length) return;

    // Array of players to emit with socket
    const arrayToEmit = Object.values(players).map((player) => ({
        id: player.id,
        nick: player.nick,
        hp: player.hp,
        mp: player.mp,
        position: player.position,
        rotation: player.rotation
    }));

    // Emit players to each connected player
    for (const id in players) {
        players[id].socket.emit('gameState', arrayToEmit);
    }
}, 20);

const PORT = 7940;

server.listen(PORT);
console.log(`Started at ${PORT}`);
