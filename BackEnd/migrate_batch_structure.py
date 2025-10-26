"""
Migration script to add batch_type column to batches table
"""
from sqlalchemy import create_engine, text


engine = create_engine("sqlite:///database.db", connect_args={"check_same_thread": False})


with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE batches ADD COLUMN batch_type VARCHAR"))
        conn.commit()
        print("✅ Added batch_type column to batches table")
    except Exception as e:
        print(f"Column may already exist or other error: {e}")
    

    try:
        conn.execute(text("UPDATE batches SET batch_type = 'B.Tech' WHERE batch_type IS NULL"))
        conn.commit()
        print("✅ Updated existing batches with default batch_type")
    except Exception as e:
        print(f"Error updating batches: {e}")

print("✅ Migration complete!")

