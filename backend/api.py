from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
from werkzeug.security import check_password_hash, generate_password_hash
import jwt
from datetime import datetime, timedelta
import os

app = Flask(__name__)
CORS(app)
app.config['SECRET_KEY'] = 'your-secret-key-change-this-in-production'

# Database path
DB_PATH = 'rescueplex.db'

# Initialize database
def init_db():
    """Create database and tables if they don't exist"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    c.execute('''CREATE TABLE IF NOT EXISTS officers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')
    
    conn.commit()
    conn.close()
    print("Database initialized successfully")

# Add demo officers
def add_demo_officers():
    """Add demo officers for testing"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    demo_officers = [
        ('officer1@rescue.com', 'rescue123', 'Officer One'),
        ('officer2@rescue.com', 'rescue123', 'Officer Two'),
        ('test@gmail.com', 'password123', 'Test Officer'),
    ]
    
    for email, password, name in demo_officers:
        try:
            hashed_password = generate_password_hash(password)
            c.execute('INSERT INTO officers (email, password, name) VALUES (?, ?, ?)',
                      (email, hashed_password, name))
            print(f"Added officer: {email}")
        except sqlite3.IntegrityError:
            print(f"Officer already exists: {email}")
    
    conn.commit()
    conn.close()

# Initialize on startup
init_db()
add_demo_officers()

def get_officer_by_email(email):
    """Retrieve officer from database by email"""
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

@app.route('/api/test', methods=['GET'])
def test():
    """Test endpoint to verify backend is working"""
    return jsonify({'message': 'Backend is working!', 'timestamp': datetime.now().isoformat()}), 200

@app.route('/api/officer/login', methods=['POST'])
def officer_login():
    """Officer login endpoint"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        
        email = data.get('email', '').strip()
        password = data.get('password', '')
        
        # Validate input
        if not email or not password:
            return jsonify({'success': False, 'error': 'Email and password are required'}), 400
        
        # Get officer from database
        officer = get_officer_by_email(email)
        
        if not officer:
            return jsonify({'success': False, 'error': 'Invalid email or password'}), 401
        
        officer_id, officer_email, hashed_password, officer_name = officer
        
        # Check password
        if not check_password_hash(hashed_password, password):
            return jsonify({'success': False, 'error': 'Invalid email or password'}), 401
        
        # Generate JWT token
        token = jwt.encode({
            'officer_id': officer_id,
            'email': officer_email,
            'name': officer_name,
            'exp': datetime.utcnow() + timedelta(hours=24)
        }, app.config['SECRET_KEY'], algorithm='HS256')
        
        # Return success response
        return jsonify({
            'success': True,
            'message': 'Login successful',
            'token': token,
            'officer': {
                'id': officer_id,
                'email': officer_email,
                'name': officer_name
            }
        }), 200
    
    except Exception as e:
        print(f"Login error: {str(e)}")
        return jsonify({'success': False, 'error': 'Server error. Please try again.'}), 500

@app.route('/api/officer/register', methods=['POST'])
def officer_register():
    """Officer registration endpoint"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        
        email = data.get('email', '').strip()
        password = data.get('password', '')
        name = data.get('name', '').strip()
        
        # Validate input
        if not email or not password or not name:
            return jsonify({'success': False, 'error': 'All fields are required'}), 400
        
        if len(password) < 8:
            return jsonify({'success': False, 'error': 'Password must be at least 8 characters'}), 400
        
        # Hash password
        hashed_password = generate_password_hash(password)
        
        # Insert into database
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        
        try:
            c.execute('INSERT INTO officers (email, password, name) VALUES (?, ?, ?)',
                      (email, hashed_password, name))
            conn.commit()
            conn.close()
            
            return jsonify({
                'success': True,
                'message': 'Officer registered successfully'
            }), 201
        
        except sqlite3.IntegrityError:
            conn.close()
            return jsonify({'success': False, 'error': 'Email already registered'}), 409
    
    except Exception as e:
        print(f"Register error: {str(e)}")
        return jsonify({'success': False, 'error': 'Server error. Please try again.'}), 500

@app.route('/api/officer/verify', methods=['POST'])
def verify_token():
    """Verify JWT token"""
    try:
        data = request.get_json()
        token = data.get('token')
        
        if not token:
            return jsonify({'success': False, 'error': 'No token provided'}), 400
        
        payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        
        return jsonify({
            'success': True,
            'officer': payload
        }), 200
    
    except jwt.ExpiredSignatureError:
        return jsonify({'success': False, 'error': 'Token expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'success': False, 'error': 'Invalid token'}), 401
    except Exception as e:
        return jsonify({'success': False, 'error': 'Server error'}), 500

@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'db': 'connected' if os.path.exists(DB_PATH) else 'not found'
    }), 200

if __name__ == '__main__':
    print("=" * 50)
    print("🚀 Rescueplex Officer Login Backend")
    print("=" * 50)
    print("Starting server on http://localhost:5000")
    print("\nDemo Credentials:")
    print("  Email: officer1@rescue.com")
    print("  Password: rescue123")
    print("=" * 50)
    app.run(debug=True, host='localhost', port=5000, use_reloader=True)