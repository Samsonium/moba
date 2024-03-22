import { type Euler, Vector3 } from 'three';
import { io, type Socket } from 'socket.io-client';
import { Easing, Tween } from '@tweenjs/tween.js';
import Character from '../graphics/Character';
import type Graphics from '../graphics';
import type EmitEvents from './EmitEvents';
import type ListenEvents from './ListenEvents';
import type PlayerNetData from './player/PlayerNetData';
import type MessageNetData from './message/MessageNetData';
import type LocalCharacter from '../graphics/LocalCharater';

/** Network class that implements packets sending and receiving */
export default class Network {
    private readonly socket: Socket<ListenEvents, EmitEvents>;

    /** Graphics class instance */
    private readonly g: Graphics;

    /** LocalCharacter class instance */
    private readonly lc: LocalCharacter;

    /** Other players on the server */
    private readonly players: {
        tween: {
            position: Tween<Vector3>,
            rotation: Tween<Euler>
        },
        net: PlayerNetData,
        character: Character
    }[];

    /** Message history */
    private readonly messages: MessageNetData[];

    /** Data send timer */
    private sentTimer: any;

    public constructor(g: Graphics, lc: LocalCharacter) {
        this.players = [];
        this.messages = [];
        this.g = g;
        this.lc = lc;
        this.socket = io('ws://localhost:7940', {
            autoConnect: false,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000
        });

        this.socket.on('connect', this.handleConnection.bind(this));
        this.socket.on('gameState', this.handleWorldUpdate.bind(this));
        this.socket.on('message', this.handleMessage.bind(this));
        this.socket.on('exposeEnd', this.handleExposeEnd.bind(this));
    }

    /** Connect to the socket */
    public connect() {
        this.socket.connect();
    }

    /** Close connection */
    public destroy() {
        clearInterval(this.sentTimer);
        this.socket.disconnect();
        if (import.meta.env.DEV)
            console.log('Destroying connection');
    }

    /** Update players */
    public update() {
        for (const player of this.players) {
            player.tween.position.update();
            player.tween.rotation.update();
        }
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
     * Handle exposeEnd event and retrieve self player ID
     * @param id self id
     * @private
     */
    private handleExposeEnd(id: string): void {
        this.lc.net.id = id;
        if (import.meta.env.DEV)
            console.log('Expose finished. Assigned ID:', this.lc.net.id);

        this.sentTimer = setInterval(() => {
            this.socket.emit('playerUpdate', this.lc.net);
        }, 20);
    }

    /**
     * Handle world update
     * @param players players list
     * @private
     */
    private handleWorldUpdate(players: PlayerNetData[]): void {
        for (const player of players) {
            if (player.id === this.lc.net.id) {
                this.lc.net.hp = player.hp;
                this.lc.net.mp = player.mp;
                continue;
            }

            const existentPlayer = this.players
                .find((p) => p.net.id === player.id);

            const position = new Vector3(
                player.position.x,
                player.position.y,
                player.position.z
            );

            if (existentPlayer) {
                existentPlayer.net = player;

                existentPlayer.tween.position.stop();
                existentPlayer.tween.rotation.stop();

                existentPlayer.tween.position = new Tween(existentPlayer.character.position)
                    .to(position, 50)
                    .easing(Easing.Linear.None)
                    .start();
                existentPlayer.tween.rotation = new Tween(existentPlayer.character.rotation)
                    .to({ y: player.rotation }, 50)
                    .easing(Easing.Linear.None)
                    .start();
            } else {
                const character = new Character(this.g, position);
                this.players.push({
                    character,
                    net: player,
                    tween: {
                        position: new Tween(character.position),
                        rotation: new Tween(character.rotation)
                    }
                });
                if (import.meta.env.DEV)
                    console.log('New player:', player.nick, `(${player.id})`);
            }
        }

        // Validate disconnected players
        let deletedCount = 0;
        for (let i = 0; i < this.players.length; i++) {
            const player = this.players[i];
            if (!players.find((p) => p.id === player.net.id)) {
                player.character.destroy();
                this.players.splice(i, 1);
                console.log('Delete disconnected player');
                deletedCount++;
            }
        }

        if (deletedCount && import.meta.env.DEV)
            console.log('Deleted characters:', deletedCount);
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
