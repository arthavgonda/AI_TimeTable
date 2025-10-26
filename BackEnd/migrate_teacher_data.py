#!/usr/bin/env python3
"""
Migration script to add new columns to teacher_data table.
Run this script to update the database schema.
"""

from sqlalchemy import create_engine, text
import sys

DATABASE_URL = "sqlite:///database.db"

def migrate_database():
    """Add missing columns to teacher_data table if they don't exist."""
    engine = create_engine(DATABASE_URL)
    
    try:
        with engine.connect() as conn:
            # Check and add each column if it doesn't exist
            columns_to_add = [
                ("earliest_time", "TEXT"),
                ("latest_time", "TEXT"),
                ("preferred_days", "TEXT"),  # JSON stored as TEXT
                ("preferred_slots", "TEXT"),  # JSON stored as TEXT
                ("unavailable_days", "TEXT")  # JSON stored as TEXT
            ]
            
            for col_name, col_type in columns_to_add:
                try:
                    # Check if column exists by attempting to query it
                    conn.execute(text(f"SELECT {col_name} FROM teacher_data LIMIT 1"))
                    print(f"Column {col_name} already exists, skipping...")
                except Exception:
                    # Column doesn't exist, add it
                    print(f"Adding column {col_name}...")
                    conn.execute(text(f"ALTER TABLE teacher_data ADD COLUMN {col_name} {col_type}"))
                    conn.commit()
                    print(f"Successfully added column {col_name}")
        
        print("\n✅ Migration completed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error during migration: {e}")
        return False
    
    finally:
        engine.dispose()

if __name__ == "__main__":
    success = migrate_database()
    sys.exit(0 if success else 1)
