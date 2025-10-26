
"""
Database migration script to add teacher preference columns
"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "database.db")

def migrate():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    

    cursor.execute("PRAGMA table_info(teacher_data)")
    columns = [col[1] for col in cursor.fetchall()]
    

    new_columns = [
        ("earliest_time", "TEXT"),
        ("latest_time", "TEXT"),
        ("preferred_days", "TEXT"),
        ("preferred_slots", "TEXT"),
        ("unavailable_days", "TEXT")
    ]
    
    for col_name, col_type in new_columns:
        if col_name not in columns:
            try:
                cursor.execute(f"ALTER TABLE teacher_data ADD COLUMN {col_name} {col_type}")
                print(f"✅ Added column: {col_name}")
            except sqlite3.OperationalError as e:
                print(f"⚠️  Column {col_name} might already exist: {e}")
    
    conn.commit()
    conn.close()
    print("✅ Database migration completed!")

if __name__ == "__main__":
    migrate()

