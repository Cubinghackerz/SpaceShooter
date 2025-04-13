import time
from flask import Flask, render_template, request
import os
from flask_sqlalchemy import SQLAlchemy
from flask_socketio import SocketIO, emit, join_room, leave_room
import logging
import json

# Configure logging
logging.basicConfig(level=logging.DEBUG)

# Initialize Flask app
app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

# Database configuration
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL")
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
}
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.secret_key = os.environ.get("FLASK_SECRET_KEY", "default_secret_key")

# Initialize database
db = SQLAlchemy(app)

# Import models after db initialization
from models import Score

# Create tables
try:
    with app.app_context():
        db.create_all()
except Exception as e:
    app.logger.error(f"Database initialization error: {e}")
    print("Failed to initialize database. Please check your DATABASE_URL environment variable.")

# Store active game rooms and players
game_rooms = {}
player_rooms = {}

@app.route('/')
def index():
    return render_template('index.html')

@socketio.on('connect')
def handle_connect():
    logging.info(f"Client connected: {request.sid}")

@socketio.on('disconnect')
def handle_disconnect():
    player_id = request.sid
    if player_id in player_rooms:
        room = player_rooms[player_id]
        leave_room(room)
        if room in game_rooms:
            game_rooms[room]['players'].remove(player_id)
            emit('player_left', {'player_id': player_id}, room=room)
            if len(game_rooms[room]['players']) == 0:
                del game_rooms[room]
        del player_rooms[player_id]

@socketio.on('join_game')
def handle_join_game(data):
    player_id = request.sid
    room = data.get('room', 'default')

    # Create room if it doesn't exist
    if room not in game_rooms:
        game_rooms[room] = {'players': [], 'state': {}}

    # Add player to room
    join_room(room)
    game_rooms[room]['players'].append(player_id)
    player_rooms[player_id] = room

    # Notify other players
    emit('player_joined', {
        'player_id': player_id,
        'players': game_rooms[room]['players']
    }, room=room)

@socketio.on('player_state')
def handle_player_state(data):
    player_id = request.sid
    if player_id in player_rooms:
        room = player_rooms[player_id]
        game_rooms[room]['state'][player_id] = data
        emit('game_state_update', {
            'player_id': player_id,
            'state': data
        }, room=room, include_self=False)

@socketio.on('chat_message')
def handle_chat_message(data):
    player_id = request.sid
    if player_id in player_rooms:
        room = player_rooms[player_id]
        message = {
            'id': str(hash(f"{player_id}-{data.get('text', '')}-{time.time()}")),
            'player_id': player_id,
            'text': data.get('text', ''),
            'timestamp': time.time(),
            'reactions': {}
        }
        # Store message in room state
        if 'messages' not in game_rooms[room]:
            game_rooms[room]['messages'] = []
        game_rooms[room]['messages'].append(message)
        # Broadcast to room
        emit('new_chat_message', message, room=room)

@socketio.on('add_reaction')
def handle_reaction(data):
    player_id = request.sid
    if player_id in player_rooms:
        room = player_rooms[player_id]
        message_id = data.get('message_id')
        emoji = data.get('emoji')

        # Find message and update reactions
        for message in game_rooms[room].get('messages', []):
            if message['id'] == message_id:
                if emoji not in message['reactions']:
                    message['reactions'][emoji] = []
                if player_id not in message['reactions'][emoji]:
                    message['reactions'][emoji].append(player_id)
                    emit('reaction_update', {
                        'message_id': message_id,
                        'reactions': message['reactions']
                    }, room=room)
                break

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)