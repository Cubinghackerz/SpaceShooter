# Flask Game Server 🎮

This is a basic Flask server for handling game-related routes.

## Setup

1. Clone the repository
2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Run the server:

```bash
python server.py
```

## Endpoints

- `GET /` – confirms server is live
- `POST /move` – receives game move in JSON `{ "move": "your_move" }`
