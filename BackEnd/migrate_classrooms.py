#!/usr/bin/env python3
"""
Database migration script to add subjects column to classrooms table
"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "database.db")

def migrate():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Check if subjects column exists
    cursor.execute("PRAGMA table_info(classrooms)")
    columns = [col[1] for col in cursor.fetchall()]
    
    if "subjects" not in columns:
        try:
            # Add subjects column (JSON stored as TEXT in SQLite)
            cursor.execute("ALTER TABLE classrooms ADD COLUMN subjects TEXT")
            print("✅ Added 'subjects' column to classrooms table")
            
            # Initialize existing classrooms with empty array
            cursor.execute("UPDATE classrooms SET subjects = '[]' WHERE subjects IS NULL")
            print("✅ Initialized subjects field for existing classrooms")
            
            conn.commit()
        except sqlite3.OperationalError as e:
            print(f"⚠️  Column might already exist: {e}")
    else:
        print("✅ 'subjects' column already exists")
    
    conn.close()
    print("✅ Classroom migration completed!")

if __name__ == "__main__":
    migrate()

