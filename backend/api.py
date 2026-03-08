from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
from werkzeug.security import check_password_hash, generate_password_hash
import jwt
from datetime import datetime, timedelta
import os

import random
import uuid
from inference_damage import DamageAssessor

from groq import Groq
from dotenv import load_dotenv

# ==============================
# App Setup
# ==============================


app = Flask(__name__)
CORS(app)

app.config['SECRET_KEY'] = 'your-secret-key-change-this'

DB_PATH = 'Rescuevision.db'
RESOURCE_DB_PATH = 'rescueplex.db'
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Load damage assessment model once at startup
damage_assessor = DamageAssessor('best_model.pth')

# ==============================
# Load Environment Variables
# ==============================

# ==============================
# Load Environment Variables
# ==============================

load_dotenv()  # Load from .env file

# DIRECT FIX - Hardcode for now
GROQ_API_KEY = ""

print(f"DEBUG: GROQ_API_KEY = {GROQ_API_KEY[:20]}...")  # Should print first 20 chars

if not GROQ_API_KEY:
    print("⚠️ WARNING: GROQ_API_KEY not found in environment variables")
    print("   Please set it with: set GROQ_API_KEY=your-key-here")
else:
    print("✅ GROQ_API_KEY loaded successfully")

# Initialize Groq client
groq_client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

# ==============================
# Database Initialization
# ==============================

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    c.execute('''CREATE TABLE IF NOT EXISTS officers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')

    c.execute('''CREATE TABLE IF NOT EXISTS disaster_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        location TEXT NOT NULL,
        description TEXT,
        severity TEXT DEFAULT 'Medium',
        reporter_name TEXT DEFAULT 'Anonymous',
        reporter_phone TEXT,
        status TEXT DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')

    # ✅ FIXED: Added latitude and longitude columns
    c.execute('''CREATE TABLE IF NOT EXISTS chatbot_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_message TEXT NOT NULL,
        bot_response TEXT NOT NULL,
        latitude REAL,
        longitude REAL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')

    conn.commit()
    conn.close()
    print("✅ Database initialized")

init_db()

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
        c.execute('INSERT INTO officers (email, password, name) VALUES (?, ?, ?)',
                  (email, hashed_password, name))
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
        'officer': {
            'id': officer_id,
            'email': officer_email,
            'name': officer_name
        }
    }), 200

# ==============================
# Disaster Reports
# ==============================

@app.route('/api/disaster/report', methods=['POST'])
def report_disaster():
    data = request.get_json()

    name = data.get('name')
    location = data.get('location')
    description = data.get('description')

    if not name or not location:
        return jsonify({'success': False, 'error': 'Name and location required'}), 400

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('INSERT INTO disaster_reports (name, location, description) VALUES (?, ?, ?)',
              (name, location, description))
    conn.commit()
    conn.close()

    return jsonify({'success': True, 'message': 'Report submitted'}), 201


@app.route('/api/disaster/reports', methods=['GET'])
def get_reports():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('SELECT * FROM disaster_reports ORDER BY created_at DESC')
    rows = c.fetchall()
    conn.close()

    reports = []
    for r in rows:
        reports.append({
            'id': r[0],
            'name': r[1],
            'location': r[2],
            'description': r[3],
            'severity': r[4],
            'reporter_name': r[5],
            'reporter_phone': r[6],
            'status': r[7],
            'created_at': r[8]
        })

    return jsonify({'success': True, 'reports': reports})


# ==============================
# Groq AI Chatbot
# ==============================

@app.route('/api/chatbot/groq-chat', methods=['POST'])
def groq_chat():
    """
    FREE AI-powered chatbot using Groq (SUPER FAST!)
    """
    try:
        # Check if Groq is available
        if not groq_client:
            return jsonify({
                'success': False,
                'error': 'Groq API key not configured',
                'fallback': True
            }), 500
        
        data = request.get_json()
        
        user_message = data.get('message', '')
        conversation_history = data.get('history', [])
        user_location = data.get('location')
        
        if not user_message:
            return jsonify({'success': False, 'error': 'Message required'}), 400
        
        # Build system prompt
        system_prompt = """You are a compassionate Relief Assistant Bot for disaster management.

Your role:
• Provide emergency information (contacts, shelters, food, medical help)
• Help find missing persons
• Offer mental health support
• Give safety guidance
• Be empathetic and clear

Response format:
• Use emojis for quick scanning (🚨 🏠 🍽️ ⚕️ 📍 💚)
• Keep responses under 250 words
• Provide actionable information
• Include contact numbers when relevant
• Suggest 2-3 follow-up options at the end

Example response structure:
🚨 **[SECTION TITLE]**

Key information:
• Point 1
• Point 2
• Point 3

Contact: [if relevant]

Would you like me to: [option 1] / [option 2] / [option 3]"""

        # Build messages array
        messages = [
            {
                "role": "system",
                "content": system_prompt
            }
        ]
        
        # Add conversation history (last 4 messages for context)
        for msg in conversation_history[-4:]:
            messages.append({
                "role": "user" if msg['type'] == 'user' else "assistant",
                "content": msg['text']
            })
        
        # Add location context if available
        location_context = ""
        if user_location:
            location_context = f"\n[User Location: Lat {user_location['latitude']:.4f}, Lon {user_location['longitude']:.4f}]"
        
        # Add current message
        messages.append({
            "role": "user",
            "content": user_message + location_context
        })
        
        # Call Groq API (SUPER FAST!)
        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",  # Best free model
            messages=messages,
            temperature=0.7,
            max_tokens=500,
            top_p=1,
            stream=False
        )
        
        bot_response = response.choices[0].message.content
        
        # Extract quick replies from response
        quick_replies = extract_quick_replies(bot_response)
        
        # Log conversation to database
        log_conversation(user_message, bot_response, user_location)
        
        return jsonify({
            'success': True,
            'response': bot_response,
            'quick_replies': quick_replies
        }), 200
    
    except Exception as e:
        print(f"❌ Groq error: {str(e)}")
        # Return error for frontend to handle fallback
        return jsonify({
            'success': False,
            'error': str(e),
            'fallback': True
        }), 500


def extract_quick_replies(text):
    """
    Extract quick reply options from bot response
    """
    quick_replies = []
    
    # Look for "Would you like" or similar patterns
    if "would you like" in text.lower() or "do you need" in text.lower():
        # Extract options after the question
        lines = text.split('\n')
        for i, line in enumerate(lines):
            if "would you like" in line.lower() or "do you need" in line.lower():
                # Look at next few lines for options
                for j in range(i+1, min(i+5, len(lines))):
                    option_line = lines[j].strip()
                    # Check for bullet points or numbered lists
                    if option_line and any(option_line.startswith(p) for p in ['•', '-', '1.', '2.', '3.']):
                        option = option_line.lstrip('•-123. ').strip()
                        if 5 < len(option) < 50:
                            quick_replies.append(option)
                break
    
    # If no options found in text, provide generic contextual ones
    if not quick_replies:
        text_lower = text.lower()
        if 'emergency' in text_lower:
            quick_replies = ['Yes, send help', 'Find shelter', 'Medical assistance']
        elif 'shelter' in text_lower:
            quick_replies = ['Get directions', 'Check capacity', 'Other options']
        elif 'food' in text_lower or 'water' in text_lower:
            quick_replies = ['Nearest location', 'Distribution times', 'Special needs']
        elif 'medical' in text_lower or 'hospital' in text_lower:
            quick_replies = ['Call ambulance', 'Nearest hospital', 'First aid tips']
        else:
            quick_replies = ['Emergency help', 'Find resources', 'Safety tips']
    
    return quick_replies[:4]  # Maximum 4 quick replies


def log_conversation(user_msg, bot_msg, location):
    """
    Log conversation to database for analytics
    """
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        
        c.execute('''INSERT INTO chatbot_logs 
                    (user_message, bot_response, latitude, longitude, created_at)
                    VALUES (?, ?, ?, ?, ?)''',
                  (user_msg, bot_msg,
                   location.get('latitude') if location else None,
                   location.get('longitude') if location else None,
                   datetime.now().isoformat()))
        
        conn.commit()
        conn.close()
        print("✅ Conversation logged")
    except Exception as e:
        print(f"⚠️ Logging error: {e}")


 
# ─── Damage Assessment endpoint ───────────────────────────────────────────────

@app.route('/api/damage/assess', methods=['POST'])
def assess_damage():
    try:
        if 'image' not in request.files:
            return jsonify({'success': False, 'error': 'No image file provided'}), 400

        file = request.files['image']

        if file.filename == '':
            return jsonify({'success': False, 'error': 'No file selected'}), 400

        allowed = {'png', 'jpg', 'jpeg', 'webp'}
        ext = file.filename.rsplit('.', 1)[-1].lower()
        if ext not in allowed:
            return jsonify({'success': False, 'error': 'Invalid file type. Use JPG, PNG or WEBP'}), 400

        # Save temporarily
        unique_name = f"{uuid.uuid4().hex}.{ext}"
        save_path = os.path.join(UPLOAD_FOLDER, unique_name)
        file.save(save_path)

        try:
            result = damage_assessor.predict(save_path)
        finally:
            if os.path.exists(save_path):
                os.remove(save_path)

        return jsonify({
            'success':             True,
            'predicted_label':     result['predicted_label'],
            'damage_level':        result['damage_level'],
            'confidence':          result['confidence'],
            'color':               result['color'],
            'all_probabilities':   result['all_probabilities'],
            'gradcam_heatmap_b64': result['gradcam_heatmap_b64'],
        }), 200

    except Exception as e:
        print(f"Damage assessment error: {str(e)}")
        return jsonify({'success': False, 'error': 'Assessment failed. Please try again.'}), 500


# ─── Health check ─────────────────────────────────────────────────────────────

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        'status':      'healthy',
        'timestamp':   datetime.now().isoformat(),
        'db':          'connected' if os.path.exists(DB_PATH) else 'not found',
        'resource_db': 'connected' if os.path.exists(RESOURCE_DB_PATH) else 'not found',
    }), 200

# ==============================
# Test Endpoint
# ==============================


@app.route('/api/chatbot/test', methods=['GET'])
def test_chatbot():
    """
    Test endpoint to verify Groq is working
    """
    if not groq_client:
        return jsonify({
            'success': False,
            'error': 'Groq API key not configured',
            'message': 'Please set GROQ_API_KEY environment variable'
        }), 500
    
    try:
        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": "Say 'Groq is working!' if you can read this."}],
            max_tokens=50
        )
        
        return jsonify({
            'success': True,
            'message': 'Groq API is working!',
            'response': response.choices[0].message.content
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


# ==============================
# Run Server
# ==============================

if __name__ == '__main__':
 
    print("=" * 50)
    print("Rescuevision Officer Login Backend")
    print("=" * 50)
    print("Starting server on http://0.0.0.0:5000")
    print("\nDemo Credentials:")
    print("  Email: officer1@rescue.com")
    print("  Password: rescue123")
    print("=" * 50)
    app.run(debug=True, host='0.0.0.0', port=5000, use_reloader=False)

    print("\n" + "="*60)
    print("🚀 RescueVision Backend")
    print("="*60)
    print("Server: http://localhost:5000")
    print("Groq AI: " + ("✅ Enabled" if groq_client else "❌ Disabled (API key missing)"))
    print("="*60 + "\n")
    app.run(debug=True, port=5000)

