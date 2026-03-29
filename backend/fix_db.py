import sqlite3

DB_PATH = 'Rescuevision.db'

conn = sqlite3.connect(DB_PATH)
c = conn.cursor()

# Add missing columns if they don't exist
columns = {
    'reporter_email': 'TEXT',
    'casualties': 'INTEGER DEFAULT 0',
    'affected_people': 'INTEGER DEFAULT 0'
}

for col, col_type in columns.items():
    c.execute(f"PRAGMA table_info(disaster_reports)")
    if col not in [row[1] for row in c.fetchall()]:
        print(f"Adding column {col}")
        c.execute(f"ALTER TABLE disaster_reports ADD COLUMN {col} {col_type}")

conn.commit()
conn.close()
print("✅ Database schema fixed. Restart server: python api.py")
