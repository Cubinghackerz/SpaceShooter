from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/')
def home():
    return "🎮 Game server is running!"

@app.route('/move', methods=['POST'])
def handle_move():
    data = request.get_json()
    move = data.get('move')
    return jsonify({"response": f"Move '{move}' received!"})

if __name__ == '__main__':
    app.run(debug=True)
