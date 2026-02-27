"""
Quick Database Checker for Rescuevision
Run this to see all disaster reports in your database
"""

import sqlite3
import os

DB_PATH = 'Rescuevision.db'

def check_database():
    print("\n" + "="*60)
    print("📊 RESCUEVISION DATABASE CHECKER")
    print("="*60)
    
    # Check if database exists
    if not os.path.exists(DB_PATH):
        print(f"❌ Database not found: {DB_PATH}")
        return
    
    print(f"✅ Database found: {DB_PATH}\n")
    
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Check officers table
        print("👮 OFFICERS:")
        print("-" * 60)
        cursor.execute("SELECT id, name, email FROM officers")
        officers = cursor.fetchall()
        
        if officers:
            for officer in officers:
                print(f"  ID: {officer[0]} | Name: {officer[1]} | Email: {officer[2]}")
        else:
            print("  No officers found")
        
        # Check disaster reports table
        print("\n🚨 DISASTER REPORTS:")
        print("-" * 60)
        cursor.execute("""
            SELECT id, name, location, severity, reporter_name, 
                   reporter_phone, status, created_at 
            FROM disaster_reports 
            ORDER BY created_at DESC
        """)
        reports = cursor.fetchall()
        
        if reports:
            print(f"  Total Reports: {len(reports)}\n")
            for report in reports:
                print(f"  📋 Report ID: {report[0]}")
                print(f"     Type: {report[1]}")
                print(f"     Location: {report[2]}")
                print(f"     Severity: {report[3]}")
                print(f"     Reporter: {report[4]} ({report[5]})")
                print(f"     Status: {report[6]}")
                print(f"     Created: {report[7]}")
                print("-" * 60)
        else:
            print("  ⚠️ No disaster reports found!")
            print("  This means reports aren't being saved to the database.")
            print("\n  Troubleshooting:")
            print("  1. Make sure backend is running (python api.py)")
            print("  2. Try submitting a report from the frontend")
            print("  3. Check browser console (F12) for errors")
        
        conn.close()
        
    except Exception as e:
        print(f"❌ Error reading database: {e}")
    
    print("\n" + "="*60)
    print("Done! Press any key to exit...")
    input()

if __name__ == '__main__':
    check_database()