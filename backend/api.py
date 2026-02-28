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

app = Flask(__name__)

CORS(app, resources={
    r"/api/*": {
        "origins": "*",
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    },
    r"/*": {
        "origins": "*",
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

app.config['SECRET_KEY'] = 'your-secret-key-change-this-in-production'

DB_PATH = 'Rescuevision.db'
RESOURCE_DB_PATH = 'rescueplex.db'
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Load damage assessment model once at startup
damage_assessor = DamageAssessor('best_model.pth')

# ─── Database init ────────────────────────────────────────────────────────────

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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        assigned_officer_id INTEGER,
        FOREIGN KEY(assigned_officer_id) REFERENCES officers(id)
    )''')

    conn.commit()
    conn.close()
    print("Database initialized successfully")


def init_resource_db():
    """Initialize resource database with default inventory"""
    conn = sqlite3.connect(RESOURCE_DB_PATH)
    c = conn.cursor()

    c.execute('''CREATE TABLE IF NOT EXISTS resources (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        resource_name TEXT UNIQUE NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 0,
        category TEXT DEFAULT 'general'
    )''')

    default_resources = [
        ('Ambulances',          50,   'medical'),
        ('Fire Trucks',         30,   'firefighting'),
        ('Rescue Teams',        200,  'rescue'),
        ('Medical Kits',        5000, 'medical'),
        ('Water Tankers',       40,   'utilities'),
        ('Food Packets',        10000,'supplies'),
        ('Helicopters',         10,   'aviation'),
        ('Boats',               25,   'water_rescue'),
        ('Tents',               3000, 'shelter'),
        ('Generators',          100,  'utilities'),
        ('Search Dogs',         30,   'rescue'),
        ('Heavy Machinery',     20,   'engineering'),
    ]

    for name, qty, cat in default_resources:
        try:
            c.execute('INSERT INTO resources (resource_name, quantity, category) VALUES (?, ?, ?)',
                      (name, qty, cat))
        except sqlite3.IntegrityError:
            pass  # Already exists

    conn.commit()
    conn.close()
    print("Resource database initialized")


def add_demo_officers():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    demo_officers = [
        ('officer1@rescue.com', 'rescue123', 'Officer One'),
        ('officer2@rescue.com', 'rescue123', 'Officer Two'),
        ('test@gmail.com',      'password123', 'Test Officer'),
    ]
    for email, password, name in demo_officers:
        try:
            hashed_password = generate_password_hash(password)
            c.execute('INSERT INTO officers (email, password, name) VALUES (?, ?, ?)',
                      (email, hashed_password, name))
        except sqlite3.IntegrityError:
            pass
    conn.commit()
    conn.close()


init_db()
init_resource_db()
add_demo_officers()

# ─── Helpers ──────────────────────────────────────────────────────────────────

def get_officer_by_email(email):
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute('SELECT id, email, password, name FROM officers WHERE email = ?', (email,))
        officer = c.fetchone()
        conn.close()
        return officer
    except Exception as e:
        print(f"Database error: {e}")
        return None


def dqn_allocate(no_damage, minor, major, total_destruction):
    """
    Simplified DQN-inspired allocation logic.
    In production this calls your trained DQN model.
    Allocation scales proportionally to damage severity.
    """
    allocation = {
        'minor_damage':      [],
        'major_damage':      [],
        'total_destruction': [],
    }

    if minor > 0:
        allocation['minor_damage'] = [
            {'resource_name': 'Medical Kits',   'allocated_quantity': minor * 2},
            {'resource_name': 'Rescue Teams',   'allocated_quantity': max(1, minor // 5)},
            {'resource_name': 'Ambulances',     'allocated_quantity': max(1, minor // 10)},
        ]

    if major > 0:
        allocation['major_damage'] = [
            {'resource_name': 'Rescue Teams',    'allocated_quantity': major * 2},
            {'resource_name': 'Ambulances',      'allocated_quantity': max(1, major // 3)},
            {'resource_name': 'Fire Trucks',     'allocated_quantity': max(1, major // 5)},
            {'resource_name': 'Heavy Machinery', 'allocated_quantity': max(1, major // 8)},
            {'resource_name': 'Medical Kits',    'allocated_quantity': major * 5},
        ]

    if total_destruction > 0:
        allocation['total_destruction'] = [
            {'resource_name': 'Helicopters',     'allocated_quantity': max(1, total_destruction // 2)},
            {'resource_name': 'Rescue Teams',    'allocated_quantity': total_destruction * 5},
            {'resource_name': 'Ambulances',      'allocated_quantity': total_destruction * 2},
            {'resource_name': 'Heavy Machinery', 'allocated_quantity': max(1, total_destruction)},
            {'resource_name': 'Tents',           'allocated_quantity': total_destruction * 20},
            {'resource_name': 'Food Packets',    'allocated_quantity': total_destruction * 50},
            {'resource_name': 'Water Tankers',   'allocated_quantity': max(1, total_destruction)},
        ]

    return allocation

# ─── Officer endpoints ─────────────────────────────────────────────────────────

@app.route('/api/test', methods=['GET'])
def test():
    return jsonify({'message': 'Backend is working!', 'timestamp': datetime.now().isoformat()}), 200


@app.route('/api/officer/login', methods=['POST'])
def officer_login():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400

        email    = data.get('email', '').strip()
        password = data.get('password', '')

        if not email or not password:
            return jsonify({'success': False, 'error': 'Email and password are required'}), 400

        officer = get_officer_by_email(email)
        if not officer:
            return jsonify({'success': False, 'error': 'Invalid email or password'}), 401

        officer_id, officer_email, hashed_password, officer_name = officer

        if not check_password_hash(hashed_password, password):
            return jsonify({'success': False, 'error': 'Invalid email or password'}), 401

        token = jwt.encode({
            'officer_id': officer_id,
            'email':      officer_email,
            'name':       officer_name,
            'exp':        datetime.utcnow() + timedelta(hours=24)
        }, app.config['SECRET_KEY'], algorithm='HS256')

        return jsonify({
            'success': True,
            'message': 'Login successful',
            'token':   token,
            'officer': {'id': officer_id, 'email': officer_email, 'name': officer_name}
        }), 200

    except Exception as e:
        print(f"Login error: {str(e)}")
        return jsonify({'success': False, 'error': 'Server error. Please try again.'}), 500


@app.route('/api/officer/register', methods=['POST'])
def officer_register():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400

        email    = data.get('email', '').strip()
        password = data.get('password', '')
        name     = data.get('name', '').strip()

        if not email or not password or not name:
            return jsonify({'success': False, 'error': 'All fields are required'}), 400
        if len(password) < 8:
            return jsonify({'success': False, 'error': 'Password must be at least 8 characters'}), 400

        hashed_password = generate_password_hash(password)
        conn = sqlite3.connect(DB_PATH)
        c    = conn.cursor()
        try:
            c.execute('INSERT INTO officers (email, password, name) VALUES (?, ?, ?)',
                      (email, hashed_password, name))
            conn.commit()
            conn.close()
            return jsonify({'success': True, 'message': 'Officer registered successfully'}), 201
        except sqlite3.IntegrityError:
            conn.close()
            return jsonify({'success': False, 'error': 'Email already registered'}), 409

    except Exception as e:
        print(f"Register error: {str(e)}")
        return jsonify({'success': False, 'error': 'Server error. Please try again.'}), 500


@app.route('/api/officer/verify', methods=['POST'])
def verify_token():
    try:
        data  = request.get_json()
        token = data.get('token')
        if not token:
            return jsonify({'success': False, 'error': 'No token provided'}), 400

        payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        return jsonify({'success': True, 'officer': payload}), 200

    except jwt.ExpiredSignatureError:
        return jsonify({'success': False, 'error': 'Token expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'success': False, 'error': 'Invalid token'}), 401
    except Exception:
        return jsonify({'success': False, 'error': 'Server error'}), 500

# ─── Disaster report endpoints ────────────────────────────────────────────────

@app.route('/api/disaster/report', methods=['POST'])
def report_disaster():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400

        name           = data.get('name', '').strip()
        location       = data.get('location', '').strip()
        description    = data.get('description', '').strip()
        severity       = data.get('severity', 'Medium')
        reporter_name  = data.get('reporter_name', 'Anonymous').strip()
        reporter_phone = data.get('reporter_phone', '').strip()

        if not name or not location:
            return jsonify({'success': False, 'error': 'Disaster name and location required'}), 400

        conn = sqlite3.connect(DB_PATH)
        c    = conn.cursor()
        c.execute('''INSERT INTO disaster_reports
                    (name, location, description, severity, reporter_name, reporter_phone, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?)''',
                  (name, location, description, severity, reporter_name, reporter_phone, 'Pending'))
        conn.commit()
        report_id = c.lastrowid
        conn.close()

        return jsonify({'success': True, 'message': 'Disaster reported successfully', 'report_id': report_id}), 201

    except Exception as e:
        print(f"Report error: {str(e)}")
        return jsonify({'success': False, 'error': 'Server error'}), 500


@app.route('/api/disaster/reports', methods=['GET'])
def get_disaster_reports():
    try:
        conn = sqlite3.connect(DB_PATH)
        c    = conn.cursor()
        c.execute('''SELECT id, name, location, description, severity, reporter_name,
                            reporter_phone, status, created_at
                     FROM disaster_reports
                     ORDER BY created_at DESC''')
        reports = c.fetchall()
        conn.close()

        reports_list = [{
            'id':            r[0],
            'name':          r[1],
            'location':      r[2],
            'description':   r[3],
            'severity':      r[4],
            'reporter_name': r[5],
            'reporter_phone':r[6],
            'status':        r[7],
            'created_at':    r[8],
        } for r in reports]

        return jsonify({'success': True, 'reports': reports_list}), 200

    except Exception as e:
        print(f"Get reports error: {str(e)}")
        return jsonify({'success': False, 'error': 'Server error'}), 500


@app.route('/api/disaster/report/<int:report_id>', methods=['PUT'])
def update_report_status(report_id):
    try:
        data   = request.get_json()
        status = data.get('status', '').strip()
        if not status:
            return jsonify({'success': False, 'error': 'Status required'}), 400

        conn = sqlite3.connect(DB_PATH)
        c    = conn.cursor()
        c.execute('UPDATE disaster_reports SET status = ? WHERE id = ?', (status, report_id))
        conn.commit()
        conn.close()

        return jsonify({'success': True, 'message': 'Report updated successfully'}), 200

    except Exception as e:
        print(f"Update error: {str(e)}")
        return jsonify({'success': False, 'error': 'Server error'}), 500


@app.route('/api/disaster/stats', methods=['GET'])
def get_disaster_stats():
    """Summary stats for the dashboard overview"""
    try:
        conn = sqlite3.connect(DB_PATH)
        c    = conn.cursor()

        c.execute('SELECT COUNT(*) FROM disaster_reports')
        total = c.fetchone()[0]

        c.execute("SELECT COUNT(*) FROM disaster_reports WHERE status = 'Pending'")
        pending = c.fetchone()[0]

        c.execute("SELECT COUNT(*) FROM disaster_reports WHERE status = 'Resolved'")
        resolved = c.fetchone()[0]

        c.execute("SELECT COUNT(*) FROM disaster_reports WHERE status = 'Active'")
        active = c.fetchone()[0]

        c.execute('''SELECT severity, COUNT(*) as cnt
                     FROM disaster_reports
                     GROUP BY severity''')
        severity_rows = c.fetchall()
        severity_breakdown = {row[0]: row[1] for row in severity_rows}

        c.execute('''SELECT name, COUNT(*) as cnt
                     FROM disaster_reports
                     GROUP BY name
                     ORDER BY cnt DESC
                     LIMIT 5''')
        type_rows = c.fetchall()
        disaster_types = [{'type': r[0], 'count': r[1]} for r in type_rows]

        c.execute('''SELECT id, name, location, severity, status, created_at
                     FROM disaster_reports
                     ORDER BY created_at DESC
                     LIMIT 5''')
        recent_rows = c.fetchall()
        recent_reports = [{
            'id':       r[0], 'name':     r[1], 'location': r[2],
            'severity': r[3], 'status':   r[4], 'created_at': r[5],
        } for r in recent_rows]

        conn.close()

        return jsonify({
            'success': True,
            'stats': {
                'total':              total,
                'pending':            pending,
                'resolved':           resolved,
                'active':             active,
                'severity_breakdown': severity_breakdown,
                'disaster_types':     disaster_types,
                'recent_reports':     recent_reports,
            }
        }), 200

    except Exception as e:
        print(f"Stats error: {str(e)}")
        return jsonify({'success': False, 'error': 'Server error'}), 500

# ─── Resource allocation endpoints ────────────────────────────────────────────

@app.route('/get-resources', methods=['GET'])
def get_resources():
    """Return current inventory"""
    try:
        conn = sqlite3.connect(RESOURCE_DB_PATH)
        c    = conn.cursor()
        c.execute('SELECT resource_name, quantity FROM resources ORDER BY resource_name')
        rows = c.fetchall()
        conn.close()

        resources = [{'resource_name': r[0], 'quantity': r[1]} for r in rows]
        return jsonify({'success': True, 'resources': resources}), 200

    except Exception as e:
        print(f"Get resources error: {str(e)}")
        return jsonify({'success': False, 'error': 'Server error'}), 500


@app.route('/allocate-resources', methods=['POST'])
def allocate_resources():
    """
    Run DQN-based allocation and deduct quantities from inventory.
    Expects JSON body:
      { building_no_damage, building_minor_damage,
        building_major_damage, building_total_destruction }
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400

        no_damage         = int(data.get('building_no_damage',         0))
        minor             = int(data.get('building_minor_damage',      0))
        major             = int(data.get('building_major_damage',      0))
        total_destruction = int(data.get('building_total_destruction', 0))

        # Run allocation
        allocation_results = dqn_allocate(no_damage, minor, major, total_destruction)

        # Deduct from inventory
        conn = sqlite3.connect(RESOURCE_DB_PATH)
        c    = conn.cursor()

        for tier_items in allocation_results.values():
            for item in tier_items:
                c.execute(
                    '''UPDATE resources
                       SET quantity = MAX(0, quantity - ?)
                       WHERE resource_name = ?''',
                    (item['allocated_quantity'], item['resource_name'])
                )

        conn.commit()

        # Return updated inventory
        c.execute('SELECT resource_name, quantity FROM resources ORDER BY resource_name')
        rows = c.fetchall()
        conn.close()

        updated_resources = [{'resource_name': r[0], 'quantity': r[1]} for r in rows]

        return jsonify({
            'success':          True,
            'allocation_results': allocation_results,
            'updated_resources':  updated_resources,
        }), 200

    except Exception as e:
        print(f"Allocate error: {str(e)}")
        return jsonify({'success': False, 'error': 'Server error'}), 500


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


if __name__ == '__main__':
    print("=" * 50)
    print("Rescuevision Officer Login Backend")
    print("=" * 50)
    print("Starting server on http://localhost:5000")
    print("\nDemo Credentials:")
    print("  Email: officer1@rescue.com")
    print("  Password: rescue123")
    print("=" * 50)
    app.run(debug=True, host='localhost', port=5000, use_reloader=False)