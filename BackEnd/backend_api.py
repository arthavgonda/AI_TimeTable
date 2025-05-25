from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import json
import asyncio
from datetime import datetime, timedelta
from ai_timetable_model import generate_timetable
from utils import subject_teacher_mapping, data, courses, SUBJECTS_BY_SEMESTER
from sqlalchemy import create_engine, Column, String, Text, JSON, Integer, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from pydantic import BaseModel
from typing import List, Dict, Optional
import uuid

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATABASE_URL = "sqlite:///database.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Timetable(Base):
    __tablename__ = "timetables"
    __table_args__ = {'extend_existing': True}
    date = Column(String, primary_key=True, index=True)
    data = Column(Text, nullable=False)

class TeacherData(Base):
    __tablename__ = "teacher_data"
    __table_args__ = {'extend_existing': True}
    id = Column(String, primary_key=True, index=True)  
    subject_sections = Column(JSON, nullable=True)  
    sections_taught = Column(JSON, nullable=True)     
    availability = Column(JSON, nullable=True)        
    lecture_limit = Column(Integer, nullable=True)    

class Teacher(Base):
    __tablename__ = "teachers"
    __table_args__ = {'extend_existing': True}
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    courses = Column(JSON, nullable=True)
    course_subjects = Column(JSON, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)    

class TeacherAvailabilityUpdate(BaseModel):
    teacher_id: str
    available: bool

class TeacherSubjectSections(BaseModel):
    teacher_id: str
    subject: str
    sections: list[str]

class TeacherLectureLimit(BaseModel):
    teacher_id: str
    lecture_limit: int

class TeacherSectionsTaughtUpdate(BaseModel):
    teacher_id: str
    sections_taught: List[str]

class TeacherCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    courses: List[str] = []
    courseSubjects: Dict[str, Dict[str, List[str]]] = {}

class TeacherUpdate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    courses: List[str] = []
    courseSubjects: Dict[str, Dict[str, List[str]]] = {}

try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(e)

teacher_subject_sections = {}  
teacher_sections_taught = {}
teacher_availability = {teacher: True for teacher in data["teachers"]}  
teacher_lecture_limits = {}  

def load_persisted_data():
    global teacher_subject_sections, teacher_sections_taught, teacher_availability, teacher_lecture_limits
    db = SessionLocal()
    try:
        for teacher in data["teachers"]:
            teacher_data = db.query(TeacherData).filter(TeacherData.id == teacher).first()
            if teacher_data:
                if teacher_data.subject_sections:
                    teacher_subject_sections[teacher] = teacher_data.subject_sections
                if teacher_data.sections_taught:
                    teacher_sections_taught[teacher] = teacher_data.sections_taught
                if teacher_data.availability is not None:
                    teacher_availability[teacher] = teacher_data.availability
                if teacher_data.lecture_limit is not None:
                    teacher_lecture_limits[teacher] = teacher_data.lecture_limit
            else:
                new_teacher = TeacherData(id=teacher, subject_sections={}, sections_taught=[], availability=True, lecture_limit=None)
                db.add(new_teacher)
        db.commit()
    except Exception as e:
        print(e)
        db.rollback()
    finally:
        db.close()

def save_persisted_data():
    global teacher_subject_sections, teacher_sections_taught, teacher_availability, teacher_lecture_limits
    db = SessionLocal()
    try:
        for teacher in data["teachers"]:
            teacher_data = db.query(TeacherData).filter(TeacherData.id == teacher).first()
            if not teacher_data:
                teacher_data = TeacherData(id=teacher)
            teacher_data.subject_sections = teacher_subject_sections.get(teacher, {})
            teacher_data.sections_taught = teacher_sections_taught.get(teacher, [])
            teacher_data.availability = teacher_availability.get(teacher, True)
            teacher_data.lecture_limit = teacher_lecture_limits.get(teacher, None)
            db.merge(teacher_data)
        db.commit()
    except Exception as e:
        print(e)
        db.rollback()
    finally:
        db.close()

def store_timetable(start_date=None):
    if not start_date or not start_date.strip():  
        today = datetime.now()
        start_date = today.strftime("%Y-%m-%d")
    try:
        start = datetime.strptime(start_date, "%Y-%m-%d")
    except ValueError:
        today = datetime.now()
        start_date = today.strftime("%Y-%m-%d")
        start = today
    timetable = generate_timetable(
        start_date, 
        teacher_subject_sections, 
        teacher_sections_taught, 
        teacher_lecture_limits,
        teacher_availability
    )
    db = SessionLocal()
    db_timetable = Timetable(date=start_date, data=json.dumps(timetable))
    db.merge(db_timetable)
    db.commit()
    db.close()
    end_date = (datetime.strptime(start_date, "%Y-%m-%d") + timedelta(days=5)).strftime("%Y-%m-%d")
    print(f"Stored timetable starting {start_date} to {end_date}: {json.dumps(timetable, indent=4)}")
    return timetable, start_date

async def schedule_timetable_generation():
    while True:
        now = datetime.now()
        next_run = now + timedelta(days=1)
        next_run = next_run.replace(hour=0, minute=0, second=0, microsecond=0)
        wait_time = (next_run - now).total_seconds()
        await asyncio.sleep(wait_time)
        timetable, start_date = store_timetable()
        print(f"Timetable generated for starting {start_date}")

@app.on_event("startup")
async def startup_event():
    load_persisted_data()
    asyncio.create_task(schedule_timetable_generation())

@app.get("/")
def home():
    return {"message": "AI Timetable Backend is Running!"}

@app.get("/generate")
def generate(date: str = None):
    timetable, start_date = store_timetable(date)
    end_date = (datetime.strptime(start_date, "%Y-%m-%d") + timedelta(days=5)).strftime("%Y-%m-%d")
    return {"date": start_date, "end_date": end_date, "timetable": timetable}

@app.get("/timetable/{date}")
def get_timetable(date: str):
    db = SessionLocal()
    all_timetables = db.query(Timetable).order_by(Timetable.date.desc()).all()
    for db_timetable in all_timetables:
        start_date = db_timetable.date
        end_date = (datetime.strptime(start_date, "%Y-%m-%d") + timedelta(days=5)).strftime("%Y-%m-%d")
        if start_date <= date <= end_date:
            db.close()
            return {"date": start_date, "end_date": end_date, "timetable": json.loads(db_timetable.data)}
    db.close()
    latest_timetable = db.query(Timetable).order_by(Timetable.date.desc()).first()
    if latest_timetable:
        start_date = latest_timetable.date
        end_date = (datetime.strptime(start_date, "%Y-%m-%d") + timedelta(days=5)).strftime("%Y-%m-%d")
        return {"error": f"Timetable generated for {start_date} to {end_date}. Please type a date between these to view."}
    return {"error": "No timetable found."}

@app.get("/notify")
def notify_users():
    next_monday = datetime.now() + timedelta(days=(7 - datetime.now().weekday()) % 7 + 1)
    next_monday_str = next_monday.strftime("%Y-%m-%d")
    db = SessionLocal()
    db_timetable = db.query(Timetable).filter(Timetable.date == next_monday_str).first()
    db.close()
    if db_timetable:
        return {"message": "Notifications sent successfully!"}
    return {"error": "No timetable found for the next week."}

@app.post("/update_teacher_availability")
def update_teacher_availability(update: TeacherAvailabilityUpdate):
    teacher_id = update.teacher_id
    available = update.available
    if teacher_id in teacher_availability:
        old_availability = teacher_availability[teacher_id]
        teacher_availability[teacher_id] = available
        save_persisted_data()
        timetable, start_date = store_timetable()
        return {
            "message": f"Updated availability for {teacher_id} to {available} and regenerated timetable",
            "timetable": timetable
        }
    raise HTTPException(status_code=404, detail="Teacher not found")

@app.post("/assign_teacher_subject_sections")
def assign_teacher_subject_sections(assignment: TeacherSubjectSections):
    teacher_id = assignment.teacher_id
    subject = assignment.subject
    sections = assignment.sections
    if teacher_id not in data["teachers"]:
        raise HTTPException(status_code=404, detail="Teacher not found")
    if subject not in data["subjects"]:
        raise HTTPException(status_code=404, detail="Subject not found")
    if teacher_id not in subject_teacher_mapping[subject]:
        raise HTTPException(status_code=404, detail=f"Teacher {teacher_id} not qualified to teach {subject}")
    for section in sections:
        if section not in data["sections"]:
            raise HTTPException(status_code=404, detail=f"Section {section} not found")
    if teacher_id not in teacher_subject_sections:
        teacher_subject_sections[teacher_id] = {}
    teacher_subject_sections[teacher_id][subject] = sections
    save_persisted_data()
    print(f"Assigned {teacher_id} to teach {subject} in sections {sections}")
    return {"message": f"Assigned {teacher_id} to teach {subject} in sections {sections}"}

@app.get("/teacher_subject_sections")
def get_teacher_subject_sections():
    return teacher_subject_sections

@app.post("/assign_teacher_lecture_limit")
def assign_teacher_lecture_limit(limit: TeacherLectureLimit):
    teacher_id = limit.teacher_id
    lecture_limit = limit.lecture_limit
    if teacher_id not in data["teachers"]:
        raise HTTPException(status_code=404, detail="Teacher not found")
    if lecture_limit < 0:
        raise HTTPException(status_code=400, detail="Lecture limit must be non-negative")
    teacher_lecture_limits[teacher_id] = lecture_limit
    save_persisted_data()
    print(f"Assigned lecture limit of {lecture_limit} to {teacher_id}")
    return {"message": f"Assigned lecture limit of {lecture_limit} to {teacher_id}"}

@app.get("/teacher_lecture_limits")
def get_teacher_lecture_limits():
    return teacher_lecture_limits

@app.post("/update_teacher_sections_taught")
def update_teacher_sections_taught(update: TeacherSectionsTaughtUpdate):
    teacher_id = update.teacher_id
    sections_taught = update.sections_taught
    if teacher_id not in data["teachers"]:
        raise HTTPException(status_code=404, detail="Teacher not found")
    for section in sections_taught:
        if section not in data["sections"]:
            raise HTTPException(status_code=404, detail=f"Section {section} not found")
    teacher_sections_taught[teacher_id] = sections_taught
    save_persisted_data()
    timetable, start_date = store_timetable()
    return {"message": f"Updated sections taught for {teacher_id} to {sections_taught}", "timetable": timetable}

@app.get("/teacher_sections_taught")
def get_teacher_sections_taught():
    return teacher_sections_taught

@app.get("/teacher_availability")
def get_teacher_availability():
    return teacher_availability

@app.get("/teachers")
def get_all_teachers():
    db = SessionLocal()
    try:
        teachers = db.query(Teacher).filter(Teacher.is_active == True).all()
        return {
            "teachers": [
                {
                    "id": t.id,
                    "name": t.name,
                    "email": t.email,
                    "phone": t.phone,
                    "courses": t.courses or [],
                    "courseSubjects": t.course_subjects or {}
                }
                for t in teachers
            ]
        }
    finally:
        db.close()

@app.post("/add_teacher")
def add_teacher(teacher_data: TeacherCreate):
    db = SessionLocal()
    try:
        new_teacher = Teacher(
            id=str(uuid.uuid4()),
            name=teacher_data.name,
            email=teacher_data.email,
            phone=teacher_data.phone,
            courses=teacher_data.courses,
            course_subjects=teacher_data.courseSubjects,
            is_active=True
        )
        db.add(new_teacher)
        db.commit()
        
        if teacher_data.name not in data["teachers"]:
            data["teachers"].append(teacher_data.name)
        
        for course, semesters in teacher_data.courseSubjects.items():
            for semester, subjects in semesters.items():
                for subject in subjects:
                    if subject not in subject_teacher_mapping:
                        subject_teacher_mapping[subject] = []
                    if teacher_data.name not in subject_teacher_mapping[subject]:
                        subject_teacher_mapping[subject].append(teacher_data.name)
        
        teacher_availability[teacher_data.name] = True
        save_persisted_data()
        
        return {"message": f"Teacher {teacher_data.name} added successfully", "id": new_teacher.id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        db.close()

@app.put("/update_teacher/{teacher_id}")
def update_teacher(teacher_id: str, teacher_data: TeacherUpdate):
    db = SessionLocal()
    try:
        teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
        if not teacher:
            raise HTTPException(status_code=404, detail="Teacher not found")
        
        old_name = teacher.name
        teacher.name = teacher_data.name
        teacher.email = teacher_data.email
        teacher.phone = teacher_data.phone
        teacher.courses = teacher_data.courses
        teacher.course_subjects = teacher_data.courseSubjects
        
        db.commit()
        
        if old_name != teacher_data.name:
            if old_name in data["teachers"]:
                idx = data["teachers"].index(old_name)
                data["teachers"][idx] = teacher_data.name
            
            for subject, teachers in subject_teacher_mapping.items():
                if old_name in teachers:
                    idx = teachers.index(old_name)
                    teachers[idx] = teacher_data.name
            
            if old_name in teacher_availability:
                teacher_availability[teacher_data.name] = teacher_availability.pop(old_name)
            if old_name in teacher_subject_sections:
                teacher_subject_sections[teacher_data.name] = teacher_subject_sections.pop(old_name)
            if old_name in teacher_sections_taught:
                teacher_sections_taught[teacher_data.name] = teacher_sections_taught.pop(old_name)
            if old_name in teacher_lecture_limits:
                teacher_lecture_limits[teacher_data.name] = teacher_lecture_limits.pop(old_name)
        
        for subject, teachers in subject_teacher_mapping.items():
            if teacher_data.name in teachers:
                teachers.remove(teacher_data.name)
        
        for course, semesters in teacher_data.courseSubjects.items():
            for semester, subjects in semesters.items():
                for subject in subjects:
                    if subject not in subject_teacher_mapping:
                        subject_teacher_mapping[subject] = []
                    if teacher_data.name not in subject_teacher_mapping[subject]:
                        subject_teacher_mapping[subject].append(teacher_data.name)
        
        save_persisted_data()
        return {"message": f"Teacher {teacher_data.name} updated successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        db.close()

@app.delete("/delete_teacher/{teacher_id}")
def delete_teacher(teacher_id: str):
    db = SessionLocal()
    try:
        teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
        if not teacher:
            raise HTTPException(status_code=404, detail="Teacher not found")
        
        teacher.is_active = False
        db.commit()
        
        if teacher.name in data["teachers"]:
            data["teachers"].remove(teacher.name)
        
        for subject, teachers in subject_teacher_mapping.items():
            if teacher.name in teachers:
                teachers.remove(teacher.name)
        
        if teacher.name in teacher_availability:
            del teacher_availability[teacher.name]
        if teacher.name in teacher_subject_sections:
            del teacher_subject_sections[teacher.name]
        if teacher.name in teacher_sections_taught:
            del teacher_sections_taught[teacher.name]
        if teacher.name in teacher_lecture_limits:
            del teacher_lecture_limits[teacher.name]
        
        save_persisted_data()
        return {"message": f"Teacher {teacher.name} deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        db.close()

@app.get("/courses_config")
def get_courses_config():
    return {
        "courses": courses,
        "subjects_by_semester": SUBJECTS_BY_SEMESTER
    }

@app.post("/reset_teacher_availability")
def reset_teacher_availability():
    for teacher in data["teachers"]:
        teacher_availability[teacher] = True
    save_persisted_data()
    return {"message": "All teachers set to available"}
