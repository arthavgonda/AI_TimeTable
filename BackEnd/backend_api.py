from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import json
import asyncio
from datetime import datetime, timedelta
from ai_timetable_model import generate_timetable
from utils import (
    subject_teacher_mapping, data, courses, SUBJECTS_BY_SEMESTER, DEFAULT_TEACHERS,
    get_subjects_for_semester, get_sections_for_course, get_semesters_for_course,
    validate_course_semester_section, get_all_courses, get_teachers_for_subject,
    sync_teacher_to_data, remove_teacher_from_data
)
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
    earliest_time = Column(String, nullable=True)  
    latest_time = Column(String, nullable=True)    
    preferred_days = Column(JSON, nullable=True)   
    preferred_slots = Column(JSON, nullable=True)  
    unavailable_days = Column(JSON, nullable=True) 

class Classroom(Base):
    __tablename__ = "classrooms"
    __table_args__ = {'extend_existing': True}
    id = Column(String, primary_key=True, index=True)
    room_number = Column(String, nullable=False, unique=True)
    building = Column(String, nullable=True)
    floor = Column(String, nullable=True)
    capacity = Column(Integer, nullable=False)
    room_type = Column(String, nullable=False)  
    subjects = Column(JSON, nullable=True)  
    is_active = Column(Boolean, default=True, nullable=False)    

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

class ClassroomCreate(BaseModel):
    room_number: str
    building: Optional[str] = None
    floor: Optional[str] = None
    capacity: int
    room_type: str  
    subjects: List[str] = []  

class ClassroomUpdate(BaseModel):
    room_number: str
    building: Optional[str] = None
    floor: Optional[str] = None
    capacity: int
    room_type: str
    subjects: List[str] = []  

class TeacherPreferences(BaseModel):
    teacher_id: str
    earliest_time: Optional[str] = None
    latest_time: Optional[str] = None
    preferred_days: List[str] = []
    preferred_slots: List[str] = []
    unavailable_days: List[str] = []

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
        
        for teacher_name in DEFAULT_TEACHERS:
            teacher_record = db.query(Teacher).filter(Teacher.name == teacher_name).first()
            if not teacher_record:
                teacher_record = Teacher(
                    id=str(uuid.uuid4()),
                    name=teacher_name,
                    email=None,
                    phone=None,
                    courses=[],
                    course_subjects={},
                    is_active=True
                )
                db.add(teacher_record)
                print(f"Initialized default teacher: {teacher_name}")
        
        db.commit()
        
        
        all_teachers = db.query(Teacher).filter(Teacher.is_active == True).all()
        data["teachers"] = [teacher.name for teacher in all_teachers]
        print(f"Loaded {len(data['teachers'])} active teachers from database")
        
        
        for teacher_name in data["teachers"]:
            teacher_data = db.query(TeacherData).filter(TeacherData.id == teacher_name).first()
            if teacher_data:
                if teacher_data.subject_sections:
                    teacher_subject_sections[teacher_name] = teacher_data.subject_sections
                if teacher_data.sections_taught:
                    teacher_sections_taught[teacher_name] = teacher_data.sections_taught
                if teacher_data.availability is not None:
                    teacher_availability[teacher_name] = teacher_data.availability
                if teacher_data.lecture_limit is not None:
                    teacher_lecture_limits[teacher_name] = teacher_data.lecture_limit
            else:
                
                new_teacher_data = TeacherData(
                    id=teacher_name, 
                    subject_sections={}, 
                    sections_taught=[], 
                    availability=True, 
                    lecture_limit=None,
                    earliest_time=None,
                    latest_time=None,
                    preferred_days=[],
                    preferred_slots=[],
                    unavailable_days=[]
                )
                db.add(new_teacher_data)
                teacher_availability[teacher_name] = True
                print(f"Initialized TeacherData for: {teacher_name}")
        
        db.commit()
    except Exception as e:
        print(f"Error in load_persisted_data: {e}")
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

def store_timetable(start_date=None, course="BTech", semester=4):
    if not start_date or not start_date.strip():  
        today = datetime.now()
        start_date = today.strftime("%Y-%m-%d")
    try:
        start = datetime.strptime(start_date, "%Y-%m-%d")
    except ValueError:
        today = datetime.now()
        start_date = today.strftime("%Y-%m-%d")
        start = today
    
    
    is_valid, message = validate_course_semester_section(course, semester, "A")
    if not is_valid and "Section" not in message:
        print(f"Warning: {message}. Using defaults.")
        course = "BTech"
        semester = 4
    
    
    db = SessionLocal()
    try:
        teacher_preferences = {}
        for teacher in data["teachers"]:
            teacher_data = db.query(TeacherData).filter(TeacherData.id == teacher).first()
            if teacher_data:
                teacher_preferences[teacher] = {
                    "earliest_time": teacher_data.earliest_time,
                    "latest_time": teacher_data.latest_time,
                    "preferred_days": teacher_data.preferred_days or [],
                    "preferred_slots": teacher_data.preferred_slots or [],
                    "unavailable_days": teacher_data.unavailable_days or []
                }
        
        
        classrooms = []
        classroom_records = db.query(Classroom).filter(Classroom.is_active == True).all()
        for classroom in classroom_records:
            classrooms.append({
                "id": classroom.id,
                "room_number": classroom.room_number,
                "building": classroom.building,
                "floor": classroom.floor,
                "capacity": classroom.capacity,
                "room_type": classroom.room_type,
                "subjects": classroom.subjects or []
            })
        
        timetable = generate_timetable(
            start_date, 
            teacher_subject_sections, 
            teacher_sections_taught, 
            teacher_lecture_limits,
            teacher_availability,
            teacher_preferences,
            classrooms,
            course,
            semester
        )
        
        db_timetable = Timetable(date=start_date, data=json.dumps(timetable))
        db.merge(db_timetable)
        db.commit()
        
        end_date = (datetime.strptime(start_date, "%Y-%m-%d") + timedelta(days=5)).strftime("%Y-%m-%d")
        print(f"Stored timetable starting {start_date} to {end_date}: {json.dumps(timetable, indent=4)}")
        return timetable, start_date
    finally:
        db.close()

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



@app.get("/courses")
def get_courses():
    """Get all available courses"""
    return {"courses": get_all_courses()}

@app.get("/semesters/{course}")
def get_semesters(course: str):
    """Get all semesters for a specific course"""
    semesters = get_semesters_for_course(course)
    if not semesters:
        return {"error": f"Course '{course}' not found", "semesters": []}
    return {"course": course, "semesters": semesters}

@app.get("/sections/{course}")
def get_sections(course: str):
    """Get all sections for a specific course"""
    sections = get_sections_for_course(course)
    if not sections:
        return {"error": f"Course '{course}' not found", "sections": []}
    return {"course": course, "sections": sections}

@app.get("/subjects/{course}/{semester}")
def get_subjects(course: str, semester: int):
    """Get all subjects for a specific course and semester"""
    subjects = get_subjects_for_semester(course, semester)
    if not subjects:
        return {"error": f"No subjects found for {course} semester {semester}", "subjects": []}
    return {"course": course, "semester": semester, "subjects": subjects}

@app.get("/validate/{course}/{semester}/{section}")
def validate_combination(course: str, semester: int, section: str):
    """Validate if course/semester/section combination is valid"""
    is_valid, message = validate_course_semester_section(course, semester, section)
    return {"valid": is_valid, "message": message, "course": course, "semester": semester, "section": section}



@app.get("/generate")
def generate(date: str = None, course: str = "BTech", semester: int = 4):
    """Generate timetable for specified course and semester"""
    
    sections = get_sections_for_course(course)
    if not sections:
        return {"error": f"Course '{course}' not found"}
    
    subjects = get_subjects_for_semester(course, semester)
    if not subjects:
        return {"error": f"No subjects found for {course} semester {semester}"}
    
    timetable, start_date = store_timetable(date, course, semester)
    end_date = (datetime.strptime(start_date, "%Y-%m-%d") + timedelta(days=5)).strftime("%Y-%m-%d")
    return {
        "date": start_date, 
        "end_date": end_date, 
        "timetable": timetable,
        "course": course,
        "semester": semester,
        "sections": sections
    }

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
    global teacher_subject_sections
    teacher_id = assignment.teacher_id
    subject = assignment.subject
    sections = assignment.sections
    
    
    if teacher_id not in data["teachers"]:
        raise HTTPException(status_code=404, detail=f"Teacher '{teacher_id}' not found in system")
    
    
    
    
    
    if teacher_id not in teacher_subject_sections:
        teacher_subject_sections[teacher_id] = {}
    
    
    teacher_subject_sections[teacher_id][subject] = sections
    
    
    if subject not in subject_teacher_mapping:
        subject_teacher_mapping[subject] = []
    if teacher_id not in subject_teacher_mapping[subject]:
        subject_teacher_mapping[subject].append(teacher_id)
    
    
    save_persisted_data()
    
    print(f"✅ Assigned {teacher_id} to teach {subject} in sections {sections}")
    return {
        "message": f"Successfully assigned {teacher_id} to teach {subject}",
        "teacher": teacher_id,
        "subject": subject,
        "sections": sections
    }

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
    """Get all active teachers and sync with in-memory data"""
    db = SessionLocal()
    try:
        teachers = db.query(Teacher).filter(Teacher.is_active == True).all()
        
        
        data["teachers"] = [t.name for t in teachers]
        
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

@app.post("/sync_teachers")
def sync_teachers():
    """Reload all teachers from database and sync in-memory structures"""
    global teacher_availability, teacher_subject_sections, teacher_sections_taught, teacher_lecture_limits
    db = SessionLocal()
    try:
        
        all_teachers = db.query(Teacher).filter(Teacher.is_active == True).all()
        data["teachers"] = [teacher.name for teacher in all_teachers]
        
        
        for teacher_name in data["teachers"]:
            teacher_data = db.query(TeacherData).filter(TeacherData.id == teacher_name).first()
            if teacher_data:
                if teacher_data.subject_sections:
                    teacher_subject_sections[teacher_name] = teacher_data.subject_sections
                if teacher_data.sections_taught:
                    teacher_sections_taught[teacher_name] = teacher_data.sections_taught
                if teacher_data.availability is not None:
                    teacher_availability[teacher_name] = teacher_data.availability
                if teacher_data.lecture_limit is not None:
                    teacher_lecture_limits[teacher_name] = teacher_data.lecture_limit
            else:
                
                if teacher_name not in teacher_availability:
                    teacher_availability[teacher_name] = True
        
        return {
            "message": f"Successfully synced {len(data['teachers'])} teachers",
            "teachers": data["teachers"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sync error: {str(e)}")
    finally:
        db.close()

@app.post("/add_teacher")
def add_teacher(teacher_data: TeacherCreate):
    global teacher_availability, teacher_subject_sections, teacher_sections_taught, teacher_lecture_limits
    db = SessionLocal()
    try:
        
        existing = db.query(Teacher).filter(Teacher.name == teacher_data.name).first()
        if existing:
            db.close()
            return {"error": f"Teacher '{teacher_data.name}' already exists", "teacher_id": existing.id}
        
        
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
        
        
        new_teacher_data = TeacherData(
            id=teacher_data.name,  
            subject_sections={},
            sections_taught=[],
            availability=True,
            lecture_limit=None,
            earliest_time=None,
            latest_time=None,
            preferred_days=[],
            preferred_slots=[],
            unavailable_days=[]
        )
        db.add(new_teacher_data)
        db.commit()
        
        
        sync_teacher_to_data(teacher_data.name)
        
        
        teacher_availability[teacher_data.name] = True
        teacher_subject_sections[teacher_data.name] = {}
        teacher_sections_taught[teacher_data.name] = []
        teacher_lecture_limits[teacher_data.name] = None
        
        
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
    global teacher_availability, teacher_subject_sections, teacher_sections_taught, teacher_lecture_limits
    db = SessionLocal()
    try:
        teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
        if not teacher:
            raise HTTPException(status_code=404, detail="Teacher not found")
        
        teacher_name = teacher.name
        
        
        teacher.is_active = False
        db.commit()
        
        
        remove_teacher_from_data(teacher_name)
        
        
        if teacher_name in teacher_availability:
            del teacher_availability[teacher_name]
        if teacher_name in teacher_subject_sections:
            del teacher_subject_sections[teacher_name]
        if teacher_name in teacher_sections_taught:
            del teacher_sections_taught[teacher_name]
        if teacher_name in teacher_lecture_limits:
            del teacher_lecture_limits[teacher_name]
        
        
        for subject, teachers in subject_teacher_mapping.items():
            if teacher_name in teachers:
                teachers.remove(teacher_name)
        
        save_persisted_data()
        return {"message": f"Teacher {teacher_name} deleted successfully"}
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



@app.get("/classrooms")
def get_all_classrooms():
    db = SessionLocal()
    try:
        classrooms = db.query(Classroom).filter(Classroom.is_active == True).all()
        return {
            "classrooms": [
                {
                    "id": c.id,
                    "room_number": c.room_number,
                    "building": c.building,
                    "floor": c.floor,
                    "capacity": c.capacity,
                    "room_type": c.room_type,
                    "subjects": c.subjects or []
                }
                for c in classrooms
            ]
        }
    finally:
        db.close()

@app.post("/add_classroom")
def add_classroom(classroom_data: ClassroomCreate):
    db = SessionLocal()
    try:
        existing = db.query(Classroom).filter(Classroom.room_number == classroom_data.room_number).first()
        if existing:
            raise HTTPException(status_code=400, detail="Classroom with this room number already exists")
        
        new_classroom = Classroom(
            id=str(uuid.uuid4()),
            room_number=classroom_data.room_number,
            building=classroom_data.building,
            floor=classroom_data.floor,
            capacity=classroom_data.capacity,
            room_type=classroom_data.room_type,
            subjects=classroom_data.subjects,
            is_active=True
        )
        db.add(new_classroom)
        db.commit()
        return {"message": f"Classroom {classroom_data.room_number} added successfully", "id": new_classroom.id}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        db.close()

@app.put("/update_classroom/{classroom_id}")
def update_classroom(classroom_id: str, classroom_data: ClassroomUpdate):
    db = SessionLocal()
    try:
        classroom = db.query(Classroom).filter(Classroom.id == classroom_id).first()
        if not classroom:
            raise HTTPException(status_code=404, detail="Classroom not found")
        
        classroom.room_number = classroom_data.room_number
        classroom.building = classroom_data.building
        classroom.floor = classroom_data.floor
        classroom.capacity = classroom_data.capacity
        classroom.room_type = classroom_data.room_type
        classroom.subjects = classroom_data.subjects
        
        db.commit()
        return {"message": f"Classroom {classroom_data.room_number} updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        db.close()

@app.delete("/delete_classroom/{classroom_id}")
def delete_classroom(classroom_id: str):
    db = SessionLocal()
    try:
        classroom = db.query(Classroom).filter(Classroom.id == classroom_id).first()
        if not classroom:
            raise HTTPException(status_code=404, detail="Classroom not found")
        
        classroom.is_active = False
        db.commit()
        return {"message": f"Classroom {classroom.room_number} deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        db.close()



@app.get("/teacher_preferences/{teacher_id}")
def get_teacher_preferences(teacher_id: str):
    db = SessionLocal()
    try:
        teacher_data = db.query(TeacherData).filter(TeacherData.id == teacher_id).first()
        if not teacher_data:
            return {
                "earliest_time": None,
                "latest_time": None,
                "preferred_days": [],
                "preferred_slots": [],
                "unavailable_days": []
            }
        return {
            "earliest_time": teacher_data.earliest_time,
            "latest_time": teacher_data.latest_time,
            "preferred_days": teacher_data.preferred_days or [],
            "preferred_slots": teacher_data.preferred_slots or [],
            "unavailable_days": teacher_data.unavailable_days or []
        }
    finally:
        db.close()

@app.get("/all_teacher_preferences")
def get_all_teacher_preferences():
    db = SessionLocal()
    try:
        all_teachers = data["teachers"]
        preferences = {}
        for teacher in all_teachers:
            teacher_data = db.query(TeacherData).filter(TeacherData.id == teacher).first()
            if teacher_data:
                preferences[teacher] = {
                    "earliest_time": teacher_data.earliest_time,
                    "latest_time": teacher_data.latest_time,
                    "preferred_days": teacher_data.preferred_days or [],
                    "preferred_slots": teacher_data.preferred_slots or [],
                    "unavailable_days": teacher_data.unavailable_days or []
                }
            else:
                preferences[teacher] = {
                    "earliest_time": None,
                    "latest_time": None,
                    "preferred_days": [],
                    "preferred_slots": [],
                    "unavailable_days": []
                }
        return preferences
    finally:
        db.close()

@app.post("/update_teacher_preferences")
def update_teacher_preferences(preferences: TeacherPreferences):
    db = SessionLocal()
    try:
        teacher_data = db.query(TeacherData).filter(TeacherData.id == preferences.teacher_id).first()
        if not teacher_data:
            teacher_data = TeacherData(
                id=preferences.teacher_id,
                subject_sections={},
                sections_taught=[],
                availability=True,
                lecture_limit=None
            )
            db.add(teacher_data)
        
        teacher_data.earliest_time = preferences.earliest_time
        teacher_data.latest_time = preferences.latest_time
        teacher_data.preferred_days = preferences.preferred_days
        teacher_data.preferred_slots = preferences.preferred_slots
        teacher_data.unavailable_days = preferences.unavailable_days
        
        db.commit()
        
        
        timetable, start_date = store_timetable()
        
        return {
            "message": f"Updated preferences for {preferences.teacher_id}",
            "timetable": timetable
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        db.close()



@app.get("/room_utilization")
def get_room_utilization():
    """Get utilization report for all classrooms"""
    db = SessionLocal()
    try:
        
        latest_timetable_entry = db.query(Timetable).order_by(Timetable.date.desc()).first()
        if not latest_timetable_entry:
            return {"error": "No timetable found"}
        
        timetable = json.loads(latest_timetable_entry.data)
        classrooms = db.query(Classroom).filter(Classroom.is_active == True).all()
        
        utilization = {}
        total_slots = 48  
        
        for classroom in classrooms:
            used_slots = 0
            room_schedule = {}
            
            
            for section, days_data in timetable.items():
                for day, slots in days_data.items():
                    for time_slot, content in slots.items():
                        if content.get("room") == classroom.room_number:
                            used_slots += 1
                            if day not in room_schedule:
                                room_schedule[day] = []
                            room_schedule[day].append({
                                "time_slot": time_slot,
                                "section": section,
                                "subject": content.get("subject"),
                                "teacher": content.get("teacher")
                            })
            
            utilization[classroom.room_number] = {
                "room_type": classroom.room_type,
                "capacity": classroom.capacity,
                "building": classroom.building,
                "floor": classroom.floor,
                "used_slots": used_slots,
                "total_slots": total_slots,
                "utilization_percentage": round((used_slots / total_slots) * 100, 2),
                "schedule": room_schedule
            }
        
        return utilization
    finally:
        db.close()

@app.get("/room_conflicts")
def get_room_conflicts():
    """Detect and return room conflicts in the current timetable"""
    db = SessionLocal()
    try:
        latest_timetable_entry = db.query(Timetable).order_by(Timetable.date.desc()).first()
        if not latest_timetable_entry:
            return {"conflicts": []}
        
        timetable = json.loads(latest_timetable_entry.data)
        conflicts = []
        
        
        room_assignments = {}
        
        for section, days_data in timetable.items():
            for day, slots in days_data.items():
                for time_slot, content in slots.items():
                    room = content.get("room")
                    if room:
                        key = f"{day}_{time_slot}_{room}"
                        if key not in room_assignments:
                            room_assignments[key] = []
                        room_assignments[key].append({
                            "section": section,
                            "subject": content.get("subject"),
                            "teacher": content.get("teacher")
                        })
        
        
        for key, assignments in room_assignments.items():
            if len(assignments) > 1:
                parts = key.split("_")
                conflicts.append({
                    "day": parts[0],
                    "time_slot": parts[1],
                    "room": parts[2],
                    "conflicting_classes": assignments
                })
        
        return {"conflicts": conflicts}
    finally:
        db.close()
