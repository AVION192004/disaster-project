from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import sqlite3
from werkzeug.security import check_password_hash, generate_password_hash
import jwt
from datetime import datetime, timedelta
import os
import requests

import random
import math
import uuid
from inference_damage import DamageAssessor

from groq import Groq
from dotenv import load_dotenv

# ==============================
# App Setup
# ==============================

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'default-dev-secret-key')

# ✅ FIXED: Simple CORS + SocketIO — no async_mode
CORS(app, resources={r"/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*")

DB_PATH = 'Rescuevision.db'
RESOURCE_DB_PATH = 'rescueplex.db'
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

try:
    damage_assessor = DamageAssessor('best_model.pth')
except Exception as e:
    print(f"⚠️ Warning: Could not load DamageAssessor model: {e}")
    damage_assessor = None

# ==============================
# Load Environment Variables
# ==============================

load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
TELEGRAM_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")

print("DEBUG KEY:", GROQ_API_KEY[:20] if GROQ_API_KEY else "None")

if not GROQ_API_KEY:
    print("⚠️ WARNING: GROQ_API_KEY not found in environment variables")
else:
    print("✅ GROQ_API_KEY loaded successfully")

groq_client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

# ==============================
# Database Initialization
# ==============================

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    c.execute("""CREATE TABLE IF NOT EXISTS officers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )""")

    c.execute("""CREATE TABLE IF NOT EXISTS disaster_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        location TEXT NOT NULL,
        description TEXT,
        severity TEXT DEFAULT 'Medium',
        reporter_name TEXT DEFAULT 'Anonymous',
        reporter_phone TEXT,
        status TEXT DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )""")

    c.execute("""CREATE TABLE IF NOT EXISTS chatbot_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_message TEXT NOT NULL,
        bot_response TEXT NOT NULL,
        latitude REAL,
        longitude REAL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )""")

    c.execute("""CREATE TABLE IF NOT EXISTS shelters (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        latitude REAL,
        longitude REAL,
        capacity INTEGER,
        available INTEGER
    )""")

    c.execute("SELECT COUNT(*) FROM shelters")
    if c.fetchone()[0] == 0:
        shelters = [
            ("Community Hall Shelter", 9.9816, 76.2999, 200, 150),
            ("Government School Shelter", 9.9852, 76.3024, 300, 220),
            ("Relief Camp Stadium", 9.9780, 76.2950, 500, 400)
        ]
        for shelter in shelters:
            c.execute("INSERT INTO shelters (name, latitude, longitude, capacity, available) VALUES (?, ?, ?, ?, ?)", shelter)

    c.execute("""CREATE TABLE IF NOT EXISTS telegram_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chat_id TEXT UNIQUE
    )""")

    conn.commit()
    conn.close()
    print("✅ Database initialized")

init_db()

# ==============================
# SocketIO Event Handlers
# ==============================

@socketio.on('connect')
def handle_connect():
    print('✅ Client connected')
    emit('connection_response', {'data': 'Connected to RescueVision'})

@socketio.on('disconnect')
def handle_disconnect():
    print('❌ Client disconnected')

# ==============================
# Officer Auth
# ==============================

@app.route('/api/officer/register', methods=['POST'])
def officer_register():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    name = data.get('name')

    if not email or not password or not name:
        return jsonify({'success': False, 'error': 'All fields required'}), 400

    hashed_password = generate_password_hash(password)

    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute('INSERT INTO officers (email, password, name) VALUES (?, ?, ?)', (email, hashed_password, name))
        conn.commit()
        conn.close()
        return jsonify({'success': True, 'message': 'Registered successfully'}), 201
    except sqlite3.IntegrityError:
        return jsonify({'success': False, 'error': 'Email already exists'}), 409


@app.route('/api/officer/login', methods=['POST'])
def officer_login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('SELECT id, email, password, name FROM officers WHERE email = ?', (email,))
    officer = c.fetchone()
    conn.close()

    if not officer:
        return jsonify({'success': False, 'error': 'Invalid credentials'}), 401

    officer_id, officer_email, hashed_password, officer_name = officer

    if not check_password_hash(hashed_password, password):
        return jsonify({'success': False, 'error': 'Invalid credentials'}), 401

    token = jwt.encode({
        'officer_id': officer_id,
        'email': officer_email,
        'name': officer_name,
        'exp': datetime.utcnow() + timedelta(hours=24)
    }, app.config['SECRET_KEY'], algorithm='HS256')

    return jsonify({
        'success': True,
        'token': token,
        'officer': {'id': officer_id, 'email': officer_email, 'name': officer_name}
    }), 200

# ==============================
# Shelters API
# ==============================

@app.route('/api/shelters', methods=['GET'])
def get_shelters():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT id,name,latitude,longitude,capacity,available FROM shelters")
    rows = c.fetchall()
    conn.close()
    return jsonify([{"id": r[0], "name": r[1], "latitude": r[2], "longitude": r[3], "capacity": r[4], "available": r[5]} for r in rows])

@app.route('/api/shelters', methods=['POST'])
def add_shelter():
    data = request.get_json()
    name = data.get("name")
    latitude = data.get("latitude")
    longitude = data.get("longitude")
    capacity = data.get("capacity", 0)

    if not name or not latitude or not longitude:
        return jsonify({"success": False, "error": "Missing fields"}), 400

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("INSERT INTO shelters (name, latitude, longitude, capacity, available) VALUES (?, ?, ?, ?, ?)",
              (name, latitude, longitude, capacity, capacity))
    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": "Shelter added"})

@app.route('/api/shelters/nearest', methods=['POST'])
def nearest_shelter():
    data = request.get_json()
    user_lat = float(data.get("latitude"))
    user_lon = float(data.get("longitude"))

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT id,name,latitude,longitude,capacity,available FROM shelters")
    rows = c.fetchall()
    conn.close()

    nearest = None
    min_distance = 9999

    for r in rows:
        # Haversine formula for accurate geographic distance
        R = 6371  # Earth radius in km
        shelter_lat, shelter_lon = float(r[2]), float(r[3])
        dlat = math.radians(shelter_lat - user_lat)
        dlon = math.radians(shelter_lon - user_lon)
        a = math.sin(dlat/2) * math.sin(dlat/2) + \
            math.cos(math.radians(user_lat)) * math.cos(math.radians(shelter_lat)) * \
            math.sin(dlon/2) * math.sin(dlon/2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        distance = R * c

        if distance < min_distance:
            min_distance = distance
            nearest = r

    if not nearest:
        return jsonify({"error": "No shelters found"}), 404

    return jsonify({
        "id": nearest[0], "name": nearest[1],
        "latitude": nearest[2], "longitude": nearest[3],
        "capacity": nearest[4], "available": nearest[5],
        "distance_km": round(min_distance, 2)
    })

@app.route("/telegram/webhook", methods=["POST"])
def telegram_webhook():
    data = request.json

    if "message" in data:
        chat_id = data["message"].get("chat", {}).get("id")
        text = data["message"].get("text", "")

        if text == "/start":
            conn = sqlite3.connect(DB_PATH)
            c = conn.cursor()

            c.execute("INSERT OR IGNORE INTO telegram_users (chat_id) VALUES (?)", (chat_id,))
            conn.commit()
            conn.close()

            requests.post(
                f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage",
                json={
                    "chat_id": chat_id,
                    "text": "✅ You will now receive disaster alerts from RescueVision."
                }
            )

    return jsonify({"status": "ok"})
# ==============================
# Telegram Alerts
# ==============================

def send_telegram_alert(message):
    try:
        if not TELEGRAM_TOKEN or not TELEGRAM_CHAT_ID:
            print("⚠️ Telegram bot not configured")
            return

        url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"

        response = requests.post(
            url,
            json={
                "chat_id": TELEGRAM_CHAT_ID,
                "text": message,
                "parse_mode": "HTML"
            },
            timeout=5
        )

        print("Telegram response:", response.json())

    except requests.exceptions.RequestException as e:
        print("Telegram request failed:", e)
# ==============================
# Disaster Reports
# ==============================

@app.route('/api/disaster/report', methods=['POST'])
def report_disaster():
    data = request.get_json()

    name = data.get('name')
    location = data.get('location')
    description = data.get('description')
    severity = data.get('severity', 'Medium')
    reporter_name = data.get('reporter_name', 'Anonymous')
    reporter_phone = data.get('reporter_phone', '')

    if not name or not location:
        return jsonify({'success': False, 'error': 'Name and location required'}), 400

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''INSERT INTO disaster_reports 
                (name, location, description, severity, reporter_name, reporter_phone) 
                VALUES (?, ?, ?, ?, ?, ?)''',
              (name, location, description, severity, reporter_name, reporter_phone))
    report_id = c.lastrowid
    conn.commit()
    conn.close()

    send_telegram_alert(f"🚨 NEW DISASTER REPORT\n\n📍 Location: {location}\n🔥 Type: {name}\n⚠️ Severity: {severity}\n\n👤 Reporter: {reporter_name}\n📞 Phone: {reporter_phone or 'Not provided'}")

    socketio.emit('new_disaster_report', {
        'id': report_id, 'name': name, 'location': location,
        'severity': severity, 'reporter_name': reporter_name,
        'timestamp': datetime.now().isoformat()},
    )

    return jsonify({'success': True, 'message': 'Report submitted', 'report_id': report_id}), 201


@app.route('/api/disaster/report/<int:report_id>', methods=['PUT'])
def update_disaster_status(report_id):
    data = request.get_json()
    new_status = data.get('status')

    if not new_status:
        return jsonify({'success': False, 'error': 'Status required'}), 400

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('UPDATE disaster_reports SET status = ? WHERE id = ?', (new_status, report_id))
    conn.commit()
    c.execute('SELECT name, location, reporter_phone FROM disaster_reports WHERE id = ?', (report_id,))
    report = c.fetchone()
    conn.close()

    if report:
        socketio.emit('disaster_status_updated', {
            'report_id': report_id, 'name': report[0], 'location': report[1],
            'new_status': new_status, 'timestamp': datetime.now().isoformat()},
        )

    return jsonify({'success': True, 'message': 'Status updated'}), 200


@app.route('/api/disaster/reports', methods=['GET'])
def get_reports():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('SELECT * FROM disaster_reports ORDER BY created_at DESC')
    rows = c.fetchall()
    conn.close()

    return jsonify({'success': True, 'reports': [
        {'id': r[0], 'name': r[1], 'location': r[2], 'description': r[3],
         'severity': r[4], 'reporter_name': r[5], 'reporter_phone': r[6],
         'status': r[7], 'created_at': r[8]} for r in rows
    ]})

# ==============================
# Groq AI Chatbot
# ==============================

@app.route('/api/chatbot/groq-chat', methods=['POST'])
def groq_chat():
    try:
        if not groq_client:
            return jsonify({'success': False, 'error': 'Groq API key not configured', 'fallback': True}), 500

        data = request.get_json()
        user_message = data.get('message', '')
        conversation_history = data.get('history', [])
        user_location = data.get('location')

        if not user_message:
            return jsonify({'success': False, 'error': 'Message required'}), 400

        messages = [{"role": "system", "content": """You are a compassionate Relief Assistant Bot for disaster management.
Your role: Provide emergency information, help find missing persons, offer mental health support, give safety guidance.
Use emojis, keep responses under 250 words, provide actionable information."""}]

        for msg in conversation_history[-4:]:
            if isinstance(msg, dict) and 'type' in msg and 'text' in msg:
                messages.append({"role": "user" if msg['type'] == 'user' else "assistant", "content": msg['text']})

        location_context = f"\n[User Location: Lat {user_location['latitude']:.4f}, Lon {user_location['longitude']:.4f}]" if user_location else ""
        messages.append({"role": "user", "content": user_message + location_context})

        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile", messages=messages,
            temperature=0.7, max_tokens=500, top_p=1, stream=False
        )

        bot_response = response.choices[0].message.content
        log_conversation(user_message, bot_response, user_location)

        return jsonify({'success': True, 'response': bot_response, 'quick_replies': extract_quick_replies(bot_response)}), 200

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e), "fallback": True}), 500


def extract_quick_replies(text):
    text_lower = text.lower()
    if 'emergency' in text_lower:
        return ['Yes, send help', 'Find shelter', 'Medical assistance']
    elif 'shelter' in text_lower:
        return ['Get directions', 'Check capacity', 'Other options']
    elif 'food' in text_lower or 'water' in text_lower:
        return ['Nearest location', 'Distribution times', 'Special needs']
    elif 'medical' in text_lower or 'hospital' in text_lower:
        return ['Call ambulance', 'Nearest hospital', 'First aid tips']
    return ['Emergency help', 'Find resources', 'Safety tips']


def log_conversation(user_msg, bot_msg, location):
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute('''INSERT INTO chatbot_logs (user_message, bot_response, latitude, longitude, created_at)
                    VALUES (?, ?, ?, ?, ?)''',
                  (user_msg, bot_msg,
                   location.get('latitude') if location else None,
                   location.get('longitude') if location else None,
                   datetime.now().isoformat()))
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"⚠️ Logging error: {e}")

# ==============================
# Damage Assessment
# ==============================

@app.route('/api/damage/assess', methods=['POST'])
def assess_damage():
    if not damage_assessor:
        return jsonify({'success': False, 'error': 'Damage assessment model not loaded.'}), 503

    try:
        if 'image' not in request.files:
            return jsonify({'success': False, 'error': 'No image file provided'}), 400

        file = request.files['image']
        if file.filename == '':
            return jsonify({'success': False, 'error': 'No file selected'}), 400

        ext = file.filename.rsplit('.', 1)[-1].lower()
        if ext not in {'png', 'jpg', 'jpeg', 'webp'}:
            return jsonify({'success': False, 'error': 'Invalid file type'}), 400

        save_path = os.path.join(UPLOAD_FOLDER, f"{uuid.uuid4().hex}.{ext}")
        file.save(save_path)

        try:
            result = damage_assessor.predict(save_path)
        finally:
            if os.path.exists(save_path):
                os.remove(save_path)

        return jsonify({
            'success': True,
            'predicted_label': result['predicted_label'],
            'damage_level': result['damage_level'],
            'confidence': result['confidence'],
            'color': result['color'],
            'all_probabilities': result['all_probabilities'],
            'gradcam_heatmap_b64': result['gradcam_heatmap_b64'],
        }), 200

    except Exception as e:
        print(f"Damage assessment error: {str(e)}")
        return jsonify({'success': False, 'error': 'Assessment failed.'}), 500

# ==============================
# Health Check
# ==============================

@app.route('/api/health', methods=['GET'])
def health():
    print(f"✅ Health check received from {request.remote_addr}")
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'db': 'connected' if os.path.exists(DB_PATH) else 'not found',
        'resource_db': 'connected' if os.path.exists(RESOURCE_DB_PATH) else 'not found',
    }), 200

@app.route('/api/chatbot/test', methods=['GET'])
def test_chatbot():
    if not groq_client:
        return jsonify({'success': False, 'error': 'Groq API key not configured'}), 500
    try:
        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": "Say 'Groq is working!'"}],
            max_tokens=50
        )
        return jsonify({'success': True, 'message': 'Groq API is working!', 'response': response.choices[0].message.content}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ==============================

# Run Server

# ==============================

if __name__ == '__main__':
    print("=" * 60)
    print("🚀 RescueVision Backend with Real-Time Notifications")
    print("=" * 60)
    print("Server: http://localhost:5000")
    print("Groq AI: " + ("✅ Enabled" if groq_client else "❌ Disabled"))
    print("SocketIO: ✅ Enabled")
    print("=" * 60)

    socketio.run(app, host="0.0.0.0", port=5000, debug=True, use_reloader=False)
