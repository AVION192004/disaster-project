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

from groq import Groq
from dotenv import load_dotenv

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'default-dev-secret-key')

CORS(app, resources={r"/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, 'Rescuevision.db')
RESOURCE_DB_PATH = os.path.join(BASE_DIR, 'rescueplex.db')
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

try:
    from inference_damage import DamageAssessor
    model_path = os.path.join(BASE_DIR, 'best_model.pth')
    damage_assessor = DamageAssessor(model_path)
except Exception as e:
    print(f"Warning: Could not load DamageAssessor model: {e}")
    damage_assessor = None

load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
TELEGRAM_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")

if not GROQ_API_KEY:
    print("WARNING: GROQ_API_KEY not found in environment variables")
else:
    print("OK: GROQ_API_KEY loaded successfully")

groq_client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None
print("OK: GROQ ready" if groq_client else "WARNING: GROQ not configured (using fallback)")

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    c.execute("""CREATE TABLE IF NOT EXISTS officers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        phone TEXT,
        office_name TEXT,
        latitude REAL,
        longitude REAL,
        address TEXT,
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
        reporter_email TEXT,
        casualties INTEGER DEFAULT 0,
        affected_people INTEGER DEFAULT 0,
        images TEXT,
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
    print("OK: Database initialized")

init_db()

@socketio.on('connect')
def handle_connect():
    print('OK: Client connected')
    emit('connection_response', {'data': 'Connected to RescueVision'})

@socketio.on('disconnect')
def handle_disconnect():
    print('X: Client disconnected')

@app.route('/api/officer/register', methods=['POST'])
def officer_register():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    name = data.get('name')
    phone = data.get('phone')
    office_name = data.get('office_name')
    latitude = data.get('latitude')
    longitude = data.get('longitude')
    address = data.get('address')

    if not email or not password or not name:
        return jsonify({'success': False, 'error': 'All fields required'}), 400

    hashed_password = generate_password_hash(password)

    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute('''INSERT INTO officers (email, password, name, phone, office_name, latitude, longitude, address) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)''',
                  (email, hashed_password, name, phone, office_name, latitude, longitude, address))
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
        R = 6371
        shelter_lat, shelter_lon = float(r[2]), float(r[3])
        dlat = math.radians(shelter_lat - user_lat)
        dlon = math.radians(shelter_lon - user_lon)
        a = math.sin(dlat/2) * math.sin(dlat/2) + \
            math.cos(math.radians(user_lat)) * math.cos(math.radians(shelter_lat)) * \
            math.sin(dlon/2) * math.sin(dlon/2)
        c2 = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        distance = R * c2

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
                json={"chat_id": chat_id, "text": "✅ You will now receive disaster alerts from RescueVision."}
            )
    return jsonify({"status": "ok"})


def send_telegram_alert(message):
    try:
        if not TELEGRAM_TOKEN or not TELEGRAM_CHAT_ID:
            print("⚠️ Telegram bot not configured")
            return
        url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"
        response = requests.post(
            url,
            json={"chat_id": TELEGRAM_CHAT_ID, "text": message, "parse_mode": "HTML"},
            timeout=5
        )
        print("Telegram response:", response.json())
    except requests.exceptions.RequestException as e:
        print("Telegram request failed:", e)


@app.route('/api/disaster/notify', methods=['POST'])
def notify_disaster():
    try:
        data = request.get_json() or {}
        disaster_type = data.get('disaster_type', '')
        severity_raw  = data.get('severity', 'medium')
        location_name = data.get('location_name', '')
        description   = data.get('description', '')

        severity_map = {'low': 'Low', 'medium': 'Medium', 'high': 'High', 'critical': 'Critical'}
        severity = severity_map.get(severity_raw.lower(), 'Medium')

        if not disaster_type or not location_name:
            return jsonify({'success': False, 'error': 'disaster_type and location_name required'}), 400

        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute(
            '''INSERT INTO disaster_reports (name, location, description, severity, reporter_name, status)
               VALUES (?, ?, ?, ?, ?, ?)''',
            (disaster_type, location_name, description, severity, 'Admin', 'Pending')
        )
        report_id = c.lastrowid
        conn.commit()
        conn.close()

        socketio.emit('new_disaster_report', {
            'id': report_id, 'name': disaster_type, 'location': location_name,
            'severity': severity, 'reporter_name': 'Admin',
            'timestamp': datetime.now().isoformat()
        })

        send_telegram_alert(
            f"🚨 ADMIN ALERT\n📍 {location_name}\n🔥 {disaster_type}\n⚠️ {severity}\n\n{description}"
        )

        return jsonify({
            'success': True,
            'message': 'Disaster alert created and broadcast',
            'report_id': report_id,
            'notified_officers_count': 0
        }), 201

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/disaster/report', methods=['POST'])
def report_disaster():
    try:
        is_json = request.content_type and 'application/json' in request.content_type
        if is_json:
            payload = request.get_json() or {}
            get_field = lambda key, default='': payload.get(key, default)
        else:
            get_field = lambda key, default='': request.form.get(key, default)

        name           = get_field('name')
        location       = get_field('location')
        description    = get_field('description', '')
        severity       = get_field('severity', 'Medium')
        reporter_name  = get_field('reporter_name', 'Anonymous')
        reporter_phone = get_field('reporter_phone', '')
        reporter_email = get_field('reporter_email', '')

        affected_people_str = get_field('affected_people', '0')

        # Accept both combined 'casualties' and split injured/missing/deceased
        try:
            casualties = (
                int(get_field('casualties', '0') or 0)
                + int(get_field('injured', '0') or 0)
                + int(get_field('missing', '0') or 0)
                + int(get_field('deceased', '0') or 0)
            )
        except (ValueError, TypeError):
            casualties = 0

        try:
            affected_people = int(affected_people_str) if affected_people_str else 0
        except (ValueError, TypeError):
            affected_people = 0

        if not name or not location:
            return jsonify({'success': False, 'error': 'Name and location required'}), 400

        uploaded_images = []
        if 'images' in request.files:
            files = request.files.getlist('images')
            for file in files:
                if file and file.filename != '':
                    ext = file.filename.rsplit('.', 1)[-1].lower()
                    filename = f"{uuid.uuid4().hex}.{ext}"
                    save_path = os.path.join(UPLOAD_FOLDER, filename)
                    file.save(save_path)
                    uploaded_images.append(filename)

        images_str = ",".join(uploaded_images) if uploaded_images else None

        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute('''INSERT INTO disaster_reports 
                    (name, location, description, severity, reporter_name, reporter_phone, reporter_email, casualties, affected_people, images) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
                  (name, location, description, severity, reporter_name, reporter_phone, reporter_email, casualties, affected_people, images_str))
        report_id = c.lastrowid
        conn.commit()
        conn.close()

        alert_msg = f"🚨 NEW DISASTER REPORT\n\n📍 Location: {location}\n🔥 Type: {name}\n⚠️ Severity: {severity}\n\n👤 Reporter: {reporter_name}\n📞 Phone: {reporter_phone or 'Not provided'}"
        if casualties:
            alert_msg += f"\n🚑 Casualties: {casualties}"
        if affected_people:
            alert_msg += f"\n🏠 Affected: {affected_people}"

        send_telegram_alert(alert_msg)

        socketio.emit('new_disaster_report', {
            'id': report_id, 'name': name, 'location': location,
            'severity': severity, 'reporter_name': reporter_name,
            'casualties': casualties, 'affected_people': affected_people,
            'timestamp': datetime.now().isoformat()
        })

        print(f"✅ Report #{report_id} created successfully")
        return jsonify({'success': True, 'message': 'Report submitted', 'report_id': report_id}), 201

    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"❌ Report submission error: {str(e)}")
        return jsonify({'success': False, 'error': f'Server error: {str(e)}'}), 500


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
            'new_status': new_status, 'timestamp': datetime.now().isoformat()
        })

    return jsonify({'success': True, 'message': 'Status updated'}), 200


@app.route('/api/disaster/stats', methods=['GET'])
def get_stats():
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()

        c.execute("SELECT COUNT(*) FROM disaster_reports")
        total = c.fetchone()[0]

        c.execute("SELECT COUNT(*) FROM disaster_reports WHERE status = 'Pending'")
        pending = c.fetchone()[0]

        c.execute("SELECT COUNT(*) FROM disaster_reports WHERE status = 'In Progress'")
        active = c.fetchone()[0]

        c.execute("SELECT COUNT(*) FROM disaster_reports WHERE status = 'Completed'")
        resolved = c.fetchone()[0]

        c.execute("SELECT severity, COUNT(*) FROM disaster_reports GROUP BY severity")
        severity_rows = c.fetchall()
        severity_breakdown = {row[0]: row[1] for row in severity_rows}

        c.execute("SELECT name, COUNT(*) as cnt FROM disaster_reports GROUP BY name ORDER BY cnt DESC LIMIT 5")
        type_rows = c.fetchall()
        disaster_types = [{"type": row[0], "count": row[1]} for row in type_rows]

        c.execute("SELECT id, name, location, severity, status, created_at FROM disaster_reports ORDER BY created_at DESC LIMIT 10")
        recent_rows = c.fetchall()
        recent_reports = [
            {"id": r[0], "name": r[1], "location": r[2], "severity": r[3], "status": r[4], "created_at": r[5]}
            for r in recent_rows
        ]

        conn.close()

        return jsonify({
            "success": True,
            "stats": {
                "total": total,
                "pending": pending,
                "active": active,
                "resolved": resolved,
                "severity_breakdown": severity_breakdown,
                "disaster_types": disaster_types,
                "recent_reports": recent_reports
            }
        }), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


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
         'reporter_email': r[7], 'casualties': r[8], 'affected_people': r[9],
         'images': r[10], 'status': r[11], 'created_at': r[12]} for r in rows
    ]})


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


@app.route('/api/health', methods=['GET'])
def health():
    print(f"OK: Health check received from {request.remote_addr}")
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


MOCK_RESOURCES = [
    {"resource_name": "Search & Rescue Teams", "quantity": 50},
    {"resource_name": "Medical Units",          "quantity": 30},
    {"resource_name": "Fire Brigades",          "quantity": 20},
    {"resource_name": "Relief Vehicles",        "quantity": 40},
    {"resource_name": "Emergency Shelters",     "quantity": 15},
    {"resource_name": "Water Tankers",          "quantity": 25},
    {"resource_name": "Food Supplies (tons)",   "quantity": 200},
    {"resource_name": "Communication Kits",     "quantity": 35},
]

_resources = [dict(r) for r in MOCK_RESOURCES]

@app.route('/get-resources', methods=['GET'])
def get_resources():
    return jsonify({"resources": _resources})

@app.route('/allocate-resources', methods=['POST'])
def allocate_resources():
    global _resources
    data = request.get_json() or {}

    minor    = int(data.get('building_minor_damage',      0))
    major    = int(data.get('building_major_damage',      0))
    destruct = int(data.get('building_total_destruction', 0))

    def alloc(tier_count, multiplier):
        results = []
        for r in _resources:
            qty = min(r['quantity'], tier_count * multiplier)
            if qty > 0:
                r['quantity'] = max(0, r['quantity'] - qty)
                results.append({"resource_name": r['resource_name'], "allocated_quantity": qty})
        return results

    allocation_results = {
        "minor_damage":      alloc(minor,    1),
        "major_damage":      alloc(major,    3),
        "total_destruction": alloc(destruct, 5),
    }

    return jsonify({
        "allocation_results": allocation_results,
        "updated_resources":  _resources
    })


if __name__ == '__main__':
    print("=" * 60)
    print("RescueVision Backend with Real-Time Notifications")
    print("=" * 60)
    print("Server: http://localhost:5000")
    print("Groq AI: " + ("OK: Enabled" if groq_client else "X: Disabled"))
    print("SocketIO: OK: Enabled")
    print("=" * 60)

    socketio.run(app, host="0.0.0.0", port=5000, debug=True, use_reloader=False, allow_unsafe_werkzeug=True)