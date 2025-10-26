
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
            
            columns_to_add = [
                ("earliest_time", "TEXT"),
                ("latest_time", "TEXT"),
                ("preferred_days", "TEXT"),  
                ("preferred_slots", "TEXT"),  
                ("unavailable_days", "TEXT")  
            ]
            
            for col_name, col_type in columns_to_add:
                try:
                    
                    conn.execute(text(f"SELECT {col_name} FROM teacher_data LIMIT 1"))
                    print(f"Column {col_name} already exists, skipping...")
                except Exception:
                    
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
