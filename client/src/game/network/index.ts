import { io, type Socket } from 'socket.io-client';
import type EmitEvents from './EmitEvents';
import type ListenEvents from './ListenEvents';
import type MessageNetData from './message/MessageNetData';
import type PlayerNetData from './player/PlayerNetData';

/** Network class that implements packets sending and receiving */
export default class Network {
    private readonly socket: Socket<ListenEvents, EmitEvents>;

    /** Other players on the server */
    private readonly players: PlayerNetData[];

    /** Message history */
    private readonly messages: MessageNetData[];

    public constructor() {
        this.players = [];
        this.messages = [];
        this.socket = io('ws://localhost:7940', {
            autoConnect: false
        });

        this.socket.on('connect', this.handleConnection.bind(this));
        this.socket.on('gameState', this.handleWorldUpdate.bind(this));
        this.socket.on('message', this.handleMessage.bind(this));
    }

    /** Emit player state to socket */
    public sendPlayerData(data: PlayerNetData): void {
        this.socket.emit('playerUpdate', data);
    }

    /** Connect to the socket */
    public connect() {
        this.socket.connect();
    }

    /** Close connection */
    public destroy() {
        this.socket.disconnect();
    }

    /** Get players list */
    public get playerList() {
        return this.players;
    }

    /** Get message history */
    public get messageList() {
        return this.messages;
    }

    /** Handle connection */
    private handleConnection(): void {
        this.socket.emit('expose', 'Player');
        if (import.meta.env.DEV)
            console.log('Open connection');
    }

    /**
     * Handle world update
     * @param players players list
     * @private
     */
    private handleWorldUpdate(players: PlayerNetData[]): void {
        for (const player of players) {
            const existentPlayer = this.players
                .find((p) => p.id === player.id);

            if (existentPlayer) {
                [existentPlayer.hp, existentPlayer.mp, existentPlayer.position, existentPlayer.rotation] = [
                    player.hp, player.mp, player.position, player.rotation
                ];
            } else {
                this.players.push(player);
                if (import.meta.env.DEV)
                    console.log('New player:', player.nick, `(${player.id})`);
            }
        }
    }

    /**
     * Handle incoming message
     * @param data message data
     * @private
     */
    private handleMessage(data: MessageNetData) {
        this.messages.push(data);
    }
}
