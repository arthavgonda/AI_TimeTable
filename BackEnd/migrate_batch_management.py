"""
Migration script to create batch management tables
"""
from sqlalchemy import create_engine
from backend_api import Base, SessionLocal


engine = create_engine("sqlite:///database.db", connect_args={"check_same_thread": False})


Base.metadata.create_all(bind=engine)

print("✅ Batch management tables created successfully!")
print("Tables created:")
print("  - batches")
print("  - sections")
print("  - subjects")
print("  - elective_groups")
print("  - elective_enrollments")

