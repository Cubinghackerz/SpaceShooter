class MultiplayerManager {
    constructor(game) {
        this.game = game;
        this.socket = io();
        this.players = new Map();
        this.room = 'default';
        this.setupSocketHandlers();
    }

    setupSocketHandlers() {
        this.socket.on('connect', () => {
            console.log('Connected to game server');
            this.joinGame();
        });

        this.socket.on('player_joined', (data) => {
            console.log('Player joined:', data);
            this.updatePlayers(data.players);
        });

        this.socket.on('player_left', (data) => {
            console.log('Player left:', data);
            this.players.delete(data.player_id);
        });

        this.socket.on('game_state_update', (data) => {
            this.updatePlayerState(data.player_id, data.state);
        });
    }

    joinGame(room = 'default') {
        this.room = room;
        this.socket.emit('join_game', { room: this.room });
    }

    updatePlayers(playerList) {
        playerList.forEach(playerId => {
            if (!this.players.has(playerId) && playerId !== this.socket.id) {
                this.players.set(playerId, {
                    x: 0,
                    y: 0,
                    angle: 0,
                    shipType: 'default',
                    health: 100
                });
            }
        });
    }

    updatePlayerState(playerId, state) {
        if (playerId !== this.socket.id) {
            this.players.set(playerId, state);
        }
    }

    sendPlayerState() {
        if (!this.game.player) return;
        
        const state = {
            x: this.game.player.x,
            y: this.game.player.y,
            angle: this.game.player.angle,
            shipType: this.game.player.shipType,
            health: this.game.player.health
        };
        
        this.socket.emit('player_state', state);
    }

    drawOtherPlayers(ctx) {
        this.players.forEach((state, playerId) => {
            if (playerId !== this.socket.id) {
                // Draw other players using their state
                ctx.save();
                ctx.translate(state.x, state.y);
                ctx.rotate(state.angle);
                
                // Draw ship based on type
                const shipType = new ShipType(state.shipType);
                shipType.draw(ctx, 0, 0, 0);
                
                // Draw player name or ID above ship
                ctx.fillStyle = '#fff';
                ctx.textAlign = 'center';
                ctx.fillText(`Player ${playerId.substr(0, 4)}`, 0, -30);
                
                ctx.restore();
            }
        });
    }
}
