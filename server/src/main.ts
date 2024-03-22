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
    if (Object.keys(players).length < 2) return;
    console.log(`Connected players: [${Object.keys(players).length}]. Emitting server update`);
    for (const id in players) {
        const list = Object.assign({}, players);
        delete list[id];
        const filtered = Object.values(list).map((player) => ({
            id: player.id,
            nick: player.nick,
            hp: player.hp,
            mp: player.mp,
            position: player.position,
            rotation: player.rotation
        }));

        players[id].socket.emit('gameState', filtered);
    }
}, 1000);

const PORT = 7940;

server.listen(PORT);
console.log(`Started at ${PORT}`);
