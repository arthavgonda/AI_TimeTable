"""Migration script to create subject_dependencies table"""
from backend_api import Base, engine

if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    print("✅ Subject dependencies table created!")

