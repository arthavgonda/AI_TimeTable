from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
import json
import asyncio
from datetime import datetime, timedelta
from threading import Thread
import time
from ai_timetable_model import generate_timetable
from sqlalchemy import create_engine, Column, String, Text, JSON, Integer, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from pydantic import BaseModel
from typing import List, Dict, Optional
import uuid


data = {
    "teachers": [],
    "days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    "time_slots": [
        "8:00-9:00", "9:00-10:00", "10:00-11:00", "11:00-12:00",
        "12:00-13:00", "13:00-14:00", "14:00-15:00", "15:00-16:00"
    ],
    "sections": [],
    "subjects": []
}


subject_teacher_mapping = {}

def normalize_course_name(course):
    """Normalize course name to match batch_type in database"""

    mapping = {
        "BTech": "B.Tech",
        "MTech": "M.Tech",
        "btech": "B.Tech",
        "mtech": "M.Tech",
        "BTECH": "B.Tech",
        "MTECH": "M.Tech"
    }
    return mapping.get(course, course)

def get_subjects_for_semester(course, semester):
    """Get subjects for a given course and semester from database"""
    db = SessionLocal()
    try:

        normalized_course = normalize_course_name(course)


        from backend_api import Batch, Subject
        batches = db.query(Batch).filter(
            Batch.batch_type == normalized_course,
            Batch.semester == semester,
            Batch.is_active == True
        ).all()

        subjects = []
        for batch in batches:
            batch_subjects = db.query(Subject).filter(
                Subject.batch_id == batch.id,
                Subject.is_active == True
            ).all()
            for subj in batch_subjects:
                if subj.code not in subjects:
                    subjects.append(subj.code)
        return subjects
    finally:
        db.close()

def get_sections_for_course(course):
    """Get all sections for a given course from database"""
    db = SessionLocal()
    try:

        normalized_course = normalize_course_name(course)

        from backend_api import Batch, Section
        batches = db.query(Batch).filter(
            Batch.batch_type == normalized_course,
            Batch.is_active == True
        ).all()

        sections = []
        for batch in batches:
            batch_sections = db.query(Section).filter(Section.batch_id == batch.id).all()
            for sec in batch_sections:
                if sec.section_letter not in sections:
                    sections.append(sec.section_letter)
        return sections
    finally:
        db.close()

def get_semesters_for_course(course):
    """Get all semesters for a given course"""
    db = SessionLocal()
    try:
        from backend_api import Batch
        batches = db.query(Batch).filter(
            Batch.batch_type == course,
            Batch.is_active == True
        ).all()
        semesters = sorted(set([batch.semester for batch in batches]))
        return semesters
    finally:
        db.close()

def validate_course_semester_section(course, semester, section):
    """Validate if the combination of course, semester, and section is valid"""
    db = SessionLocal()
    try:
        from backend_api import Batch, Section
        batches = db.query(Batch).filter(
            Batch.batch_type == course,
            Batch.semester == semester,
            Batch.is_active == True
        ).all()

        for batch in batches:
            section_exists = db.query(Section).filter(
                Section.batch_id == batch.id,
                Section.section_letter == section
            ).first()
            if section_exists:
                return True, "Valid combination"

        return False, f"Section '{section}' not found for {course} semester {semester}"
    finally:
        db.close()

def get_all_courses():
    """Get list of all available courses"""
    db = SessionLocal()
    try:
        from backend_api import Batch
        batches = db.query(Batch).filter(Batch.is_active == True).all()
        courses = sorted(set([batch.batch_type for batch in batches]))
        return courses
    finally:
        db.close()

def get_teachers_for_subject(subject):
    """Get list of teachers who can teach a subject"""
    return subject_teacher_mapping.get(subject, [])

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


background_tasks = {}

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

class Batch(Base):
    __tablename__ = "batches"
    __table_args__ = {'extend_existing': True}
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    batch_type = Column(String, nullable=False)
    course = Column(String, nullable=False)
    semester = Column(Integer, nullable=False)
    is_active = Column(Boolean, default=True)

class Section(Base):
    __tablename__ = "sections"
    __table_args__ = {'extend_existing': True}
    id = Column(String, primary_key=True)
    batch_id = Column(String, nullable=False)
    section_letter = Column(String, nullable=False)
    student_count = Column(Integer, default=0)

class Subject(Base):
    __tablename__ = "subjects"
    __table_args__ = {'extend_existing': True}
    id = Column(String, primary_key=True)
    batch_id = Column(String, nullable=True)
    section_id = Column(String, nullable=True)
    code = Column(String, nullable=False)
    name = Column(String, nullable=False)
    subject_type = Column(String, nullable=False)
    elective_group_id = Column(String, nullable=True)
    hours_per_week = Column(Integer, default=2)
    cognitive_difficulty = Column(Integer, default=5)
    is_active = Column(Boolean, default=True)

class ElectiveGroup(Base):
    __tablename__ = "elective_groups"
    __table_args__ = {'extend_existing': True}
    id = Column(String, primary_key=True)
    batch_id = Column(String, nullable=False)
    name = Column(String, nullable=False)

class ElectiveEnrollment(Base):
    __tablename__ = "elective_enrollments"
    __table_args__ = {'extend_existing': True}
    id = Column(String, primary_key=True)
    elective_group_id = Column(String, nullable=False)
    subject_code = Column(String, nullable=False)
    enrolled_students = Column(Integer, default=0)

class SubjectDependency(Base):
    __tablename__ = "subject_dependencies"
    __table_args__ = {'extend_existing': True}
    id = Column(String, primary_key=True)
    subject_code = Column(String, nullable=False)
    dependent_subject_code = Column(String, nullable=False)
    dependency_type = Column(String, nullable=False)
    priority = Column(Integer, default=0)
    gap_days = Column(Integer, default=0)
    same_day = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)

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

class BatchCreate(BaseModel):
    name: str
    batch_type: str
    course: str
    semester: int

class SectionCreate(BaseModel):
    batch_id: str
    section_letter: str
    student_count: int = 0

class SubjectCreate(BaseModel):
    batch_id: Optional[str] = None
    section_id: Optional[str] = None
    code: str
    name: str
    subject_type: str
    elective_group_id: Optional[str] = None
    hours_per_week: int = 2
    cognitive_difficulty: int = 5

class ElectiveGroupCreate(BaseModel):
    batch_id: str
    name: str

class ElectiveEnrollmentUpdate(BaseModel):
    elective_group_id: str
    subject_code: str
    enrolled_students: int

class SubjectDependencyCreate(BaseModel):
    subject_code: str
    dependent_subject_code: str
    dependency_type: str
    priority: int = 0
    gap_days: int = 0
    same_day: bool = False

class SubjectDependencyUpdate(BaseModel):
    dependency_type: Optional[str] = None
    priority: Optional[int] = None
    gap_days: Optional[int] = None
    same_day: Optional[bool] = None
    is_active: Optional[bool] = None

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

def refresh_teacher_cache():
    """Refresh teacher cache from database and sync with ai_timetable_model"""
    global teacher_subject_sections, teacher_sections_taught, teacher_availability, teacher_lecture_limits
    import ai_timetable_model

    db = SessionLocal()
    try:

        all_teachers = db.query(Teacher).filter(Teacher.is_active == True).all()
        data["teachers"] = [teacher.name for teacher in all_teachers]


        ai_timetable_model.data["teachers"] = data["teachers"]

        print(f"Refreshed teacher cache: {len(data['teachers'])} active teachers")


        for teacher in data["teachers"]:
            if teacher not in teacher_availability:
                teacher_availability[teacher] = True
            if teacher not in teacher_lecture_limits:
                teacher_lecture_limits[teacher] = {}


        for teacher_name in data["teachers"]:
            teacher_data = db.query(TeacherData).filter(TeacherData.id == teacher_name).first()
            if teacher_data:
                if teacher_data.subject_sections:
                    teacher_subject_sections[teacher_name] = teacher_data.subject_sections
                if teacher_data.sections_taught:
                    teacher_sections_taught[teacher_name] = teacher_data.sections_taught
                if teacher_data.lecture_limit is not None:
                    teacher_lecture_limits[teacher_name] = teacher_data.lecture_limit
    except Exception as e:
        print(f"Error refreshing teacher cache: {e}")
    finally:
        db.close()

def load_persisted_data():
    """Load persisted data from database (called at startup)"""

    refresh_teacher_cache()

    db = SessionLocal()
    try:

        for teacher_name in data["teachers"]:
            teacher_data = db.query(TeacherData).filter(TeacherData.id == teacher_name).first()
            if not teacher_data:

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


        import ai_timetable_model
        ai_timetable_model.subject_teacher_mapping = {}
        for teacher_name, subjects_dict in teacher_subject_sections.items():
            for subject, sections in subjects_dict.items():
                if subject not in ai_timetable_model.subject_teacher_mapping:
                    ai_timetable_model.subject_teacher_mapping[subject] = []
                if teacher_name not in ai_timetable_model.subject_teacher_mapping[subject]:
                    ai_timetable_model.subject_teacher_mapping[subject].append(teacher_name)

        print(f"Built subject_teacher_mapping: {ai_timetable_model.subject_teacher_mapping}")

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


def generate_timetable_background(task_id, date, course, semester):
    """Background task to generate timetable"""
    global background_tasks

    try:
        background_tasks[task_id]["status"] = "running"
        background_tasks[task_id]["progress"] = 10
        background_tasks[task_id]["message"] = "Starting timetable generation..."


        if not course or not semester:
            background_tasks[task_id]["status"] = "failed"
            background_tasks[task_id]["error"] = "Please select a course and semester"
            return

        try:
            semester = int(semester)
        except ValueError:
            background_tasks[task_id]["status"] = "failed"
            background_tasks[task_id]["error"] = "Invalid semester value"
            return


        if not data["teachers"] or len(data["teachers"]) == 0:
            background_tasks[task_id]["status"] = "failed"
            background_tasks[task_id]["error"] = "No teachers available in the system."
            return

        background_tasks[task_id]["progress"] = 20
        background_tasks[task_id]["message"] = "Validating course and semester..."


        sections = get_sections_for_course(course)
        if not sections:
            background_tasks[task_id]["status"] = "failed"
            background_tasks[task_id]["error"] = f"Course '{course}' not found"
            return

        subjects = get_subjects_for_semester(course, semester)
        if not subjects:
            background_tasks[task_id]["status"] = "failed"
            background_tasks[task_id]["error"] = f"No subjects found for {course} semester {semester}"
            return

        background_tasks[task_id]["progress"] = 30
        background_tasks[task_id]["message"] = f"Generating timetable for {len(sections)} sections..."


        timetable, start_date = store_timetable(date, course, semester)

        end_date = (datetime.strptime(start_date, "%Y-%m-%d") + timedelta(days=5)).strftime("%Y-%m-%d")


        background_tasks[task_id]["status"] = "completed"
        background_tasks[task_id]["progress"] = 100
        background_tasks[task_id]["message"] = "Timetable generated successfully!"
        background_tasks[task_id]["result"] = {
            "date": start_date,
            "end_date": end_date,
            "timetable": timetable,
            "course": course,
            "semester": semester,
            "sections": sections
        }

    except Exception as e:
        background_tasks[task_id]["status"] = "failed"
        background_tasks[task_id]["error"] = str(e)
        background_tasks[task_id]["message"] = f"Error: {str(e)}"

@app.get("/generate")
def generate(date: str = None, course: str = "", semester: str = "", async_mode: bool = False):
    """Generate timetable for specified course and semester"""


    if async_mode:
        task_id = str(uuid.uuid4())
        background_tasks[task_id] = {
            "status": "pending",
            "progress": 0,
            "message": "Initializing...",
            "result": None,
            "error": None
        }


        thread = Thread(target=generate_timetable_background, args=(task_id, date, course, semester))
        thread.daemon = True
        thread.start()

        return {
            "task_id": task_id,
            "status": "started",
            "message": "Timetable generation started in background"
        }



    if not course or not semester:
        return {"error": "Please select a course and semester"}

    try:
        semester = int(semester)
    except ValueError:
        return {"error": "Invalid semester value"}


    if not data["teachers"] or len(data["teachers"]) == 0:
        return {"error": "No teachers available in the system. Please add teachers through the Teacher Management UI."}


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

@app.get("/task/{task_id}")
def get_task_status(task_id: str):
    """Get status of a background task"""
    if task_id not in background_tasks:
        raise HTTPException(status_code=404, detail="Task not found")

    task = background_tasks[task_id]
    return {
        "task_id": task_id,
        "status": task["status"],
        "progress": task["progress"],
        "message": task["message"],
        "error": task.get("error"),
        "result": task.get("result")
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
            timetable_data = json.loads(db_timetable.data)


            filtered_timetable = {}
            for section, days in timetable_data.items():
                filtered_timetable[section] = {}
                for day, time_slots in days.items():
                    filtered_timetable[section][day] = {}
                    for time_slot, content in time_slots.items():
                        teacher = content.get("teacher", "")

                        if teacher and teacher not in ["respective teacher", "Elective Faculty", ""]:
                            filtered_timetable[section][day][time_slot] = content

                        elif content.get("subject") == "Lunch":
                            filtered_timetable[section][day][time_slot] = content

            return {"date": start_date, "end_date": end_date, "timetable": filtered_timetable}
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


    if not sections or len(sections) == 0:

        if subject in teacher_subject_sections[teacher_id]:
            del teacher_subject_sections[teacher_id][subject]

        if subject in subject_teacher_mapping and teacher_id in subject_teacher_mapping[subject]:
            subject_teacher_mapping[subject].remove(teacher_id)
    else:

        teacher_subject_sections[teacher_id][subject] = sections


        if subject not in subject_teacher_mapping:
            subject_teacher_mapping[subject] = []
        if teacher_id not in subject_teacher_mapping[subject]:
            subject_teacher_mapping[subject].append(teacher_id)


    save_persisted_data()

    action = "Removed" if not sections or len(sections) == 0 else "Assigned"
    print(f"✅ {action} {teacher_id} to teach {subject} in sections {sections}")

    message = f"Successfully removed assignment" if not sections or len(sections) == 0 else f"Successfully assigned {teacher_id} to teach {subject}"

    return {
        "message": message,
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

@app.get("/teachers/search")
def search_teachers(search: Optional[str] = None, limit: int = 20):
    """Fast endpoint for searching teacher names only (for autocomplete)"""
    db = SessionLocal()
    try:
        query = db.query(Teacher.name).filter(Teacher.is_active == True)


        if search and search.strip():
            search_term = f"%{search.strip().lower()}%"
            query = query.filter(Teacher.name.ilike(search_term))


        teacher_names = [t[0] for t in query.limit(limit).all()]

        return {"teachers": teacher_names}
    finally:
        db.close()

@app.get("/teachers")
def get_all_teachers(search: Optional[str] = None, limit: int = 50):
    """Get all active teachers with optional search filtering"""
    db = SessionLocal()
    try:
        query = db.query(Teacher).filter(Teacher.is_active == True)


        if search and search.strip():
            search_term = f"%{search.strip().lower()}%"
            query = query.filter(Teacher.name.ilike(search_term))


        teachers = query.limit(limit).all()


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

            if not existing.is_active:

                existing.is_active = True
                existing.email = teacher_data.email
                existing.phone = teacher_data.phone
                existing.courses = teacher_data.courses
                existing.course_subjects = teacher_data.courseSubjects
                teacher_id = existing.id
                db.commit()
                db.close()


                refresh_teacher_cache()

                return {"message": f"Teacher '{teacher_data.name}' has been reactivated", "teacher_id": teacher_id, "reactivated": True}
            else:

                teacher_id = existing.id
                db.close()
                return {"error": f"Teacher '{teacher_data.name}' already exists", "teacher_id": teacher_id}


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


        refresh_teacher_cache()


        for course, semesters in teacher_data.courseSubjects.items():
            for semester, subjects in semesters.items():
                for subject in subjects:
                    if subject not in subject_teacher_mapping:
                        subject_teacher_mapping[subject] = []
                    if teacher_data.name not in subject_teacher_mapping[subject]:
                        subject_teacher_mapping[subject].append(teacher_data.name)

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


        refresh_teacher_cache()

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


        refresh_teacher_cache()


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


        refresh_teacher_cache()

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





Base.metadata.create_all(bind=engine)

@app.get("/batches")
def get_all_batches():
    """Get all active batches"""
    db = SessionLocal()
    try:
        batches = db.query(Batch).filter(Batch.is_active == True).all()
        return {"batches": [{"id": b.id, "name": b.name, "batch_type": b.batch_type, "course": b.course, "semester": b.semester} for b in batches]}
    finally:
        db.close()

@app.post("/batches")
def create_batch(batch: BatchCreate):
    """Create a new batch"""
    db = SessionLocal()
    try:
        batch_id = str(uuid.uuid4())
        new_batch = Batch(
            id=batch_id,
            name=batch.name,
            batch_type=batch.batch_type,
            course=batch.course,
            semester=batch.semester
        )
        db.add(new_batch)
        db.commit()
        return {"message": "Batch created successfully", "id": batch_id}
    finally:
        db.close()

@app.put("/batches/{batch_id}")
def update_batch(batch_id: str, batch: BatchCreate):
    """Update a batch"""
    db = SessionLocal()
    try:
        existing_batch = db.query(Batch).filter(Batch.id == batch_id).first()
        if not existing_batch:
            raise HTTPException(status_code=404, detail="Batch not found")

        existing_batch.name = batch.name
        existing_batch.batch_type = batch.batch_type
        existing_batch.course = batch.course
        existing_batch.semester = batch.semester

        db.commit()
        return {"message": "Batch updated successfully"}
    finally:
        db.close()

@app.delete("/batches/{batch_id}")
def delete_batch(batch_id: str):
    """Soft delete a batch (mark as inactive)"""
    db = SessionLocal()
    try:
        batch = db.query(Batch).filter(Batch.id == batch_id).first()
        if not batch:
            raise HTTPException(status_code=404, detail="Batch not found")

        batch.is_active = False
        db.commit()
        return {"message": "Batch deleted successfully"}
    finally:
        db.close()

@app.get("/batches/{batch_id}/sections")
def get_batch_sections(batch_id: str):
    """Get all sections for a batch"""
    db = SessionLocal()
    try:
        sections = db.query(Section).filter(Section.batch_id == batch_id).all()
        return {"sections": [{"id": s.id, "section_letter": s.section_letter, "student_count": s.student_count} for s in sections]}
    finally:
        db.close()

@app.post("/sections")
def create_section(section: SectionCreate):
    """Create a new section"""
    db = SessionLocal()
    try:
        section_id = str(uuid.uuid4())
        new_section = Section(
            id=section_id,
            batch_id=section.batch_id,
            section_letter=section.section_letter,
            student_count=section.student_count
        )
        db.add(new_section)
        db.commit()
        return {"message": "Section created successfully", "id": section_id}
    finally:
        db.close()

@app.put("/sections/{section_id}")
def update_section(section_id: str, section: SectionCreate):
    """Update a section"""
    db = SessionLocal()
    try:
        existing_section = db.query(Section).filter(Section.id == section_id).first()
        if not existing_section:
            raise HTTPException(status_code=404, detail="Section not found")

        existing_section.batch_id = section.batch_id
        existing_section.section_letter = section.section_letter
        existing_section.student_count = section.student_count

        db.commit()
        return {"message": "Section updated successfully"}
    finally:
        db.close()

@app.delete("/sections/{section_id}")
def delete_section(section_id: str):
    """Delete a section"""
    db = SessionLocal()
    try:
        section = db.query(Section).filter(Section.id == section_id).first()
        if not section:
            raise HTTPException(status_code=404, detail="Section not found")

        db.delete(section)
        db.commit()
        return {"message": "Section deleted successfully"}
    finally:
        db.close()

@app.get("/batches/{batch_id}/subjects")
def get_batch_subjects(batch_id: str):
    """Get all subjects for a batch"""
    db = SessionLocal()
    try:
        subjects = db.query(Subject).filter(Subject.batch_id == batch_id, Subject.is_active == True).all()
        return {"subjects": [{"id": s.id, "code": s.code, "name": s.name, "subject_type": s.subject_type, "elective_group_id": s.elective_group_id, "hours_per_week": s.hours_per_week} for s in subjects]}
    finally:
        db.close()

@app.post("/subjects")
def create_subject(subject: SubjectCreate):
    """Create a new subject"""
    db = SessionLocal()
    try:
        subject_id = str(uuid.uuid4())
        new_subject = Subject(
            id=subject_id,
            batch_id=subject.batch_id,
            section_id=subject.section_id,
            code=subject.code,
            name=subject.name,
            subject_type=subject.subject_type,
            elective_group_id=subject.elective_group_id,
            hours_per_week=subject.hours_per_week
        )
        db.add(new_subject)
        db.commit()
        return {"message": "Subject created successfully", "id": subject_id}
    finally:
        db.close()

@app.put("/subjects/{subject_id}")
def update_subject(subject_id: str, subject: SubjectCreate):
    """Update a subject"""
    db = SessionLocal()
    try:
        existing_subject = db.query(Subject).filter(Subject.id == subject_id).first()
        if not existing_subject:
            raise HTTPException(status_code=404, detail="Subject not found")

        existing_subject.batch_id = subject.batch_id
        existing_subject.section_id = subject.section_id
        existing_subject.code = subject.code
        existing_subject.name = subject.name
        existing_subject.subject_type = subject.subject_type
        existing_subject.elective_group_id = subject.elective_group_id
        existing_subject.hours_per_week = subject.hours_per_week

        db.commit()
        return {"message": "Subject updated successfully"}
    finally:
        db.close()

@app.delete("/subjects/{subject_id}")
def delete_subject(subject_id: str):
    """Soft delete a subject (mark as inactive)"""
    db = SessionLocal()
    try:
        subject = db.query(Subject).filter(Subject.id == subject_id).first()
        if not subject:
            raise HTTPException(status_code=404, detail="Subject not found")

        subject.is_active = False
        db.commit()
        return {"message": "Subject deleted successfully"}
    finally:
        db.close()

@app.get("/batches/{batch_id}/elective-groups")
def get_batch_elective_groups(batch_id: str):
    """Get all elective groups for a batch"""
    db = SessionLocal()
    try:
        groups = db.query(ElectiveGroup).filter(ElectiveGroup.batch_id == batch_id).all()
        return {"elective_groups": [{"id": g.id, "name": g.name} for g in groups]}
    finally:
        db.close()

@app.post("/elective-groups")
def create_elective_group(group: ElectiveGroupCreate):
    """Create a new elective group"""
    db = SessionLocal()
    try:
        group_id = str(uuid.uuid4())
        new_group = ElectiveGroup(
            id=group_id,
            batch_id=group.batch_id,
            name=group.name
        )
        db.add(new_group)
        db.commit()
        return {"message": "Elective group created successfully", "id": group_id}
    finally:
        db.close()

@app.put("/elective-groups/{group_id}")
def update_elective_group(group_id: str, group: ElectiveGroupCreate):
    """Update an elective group"""
    db = SessionLocal()
    try:
        existing_group = db.query(ElectiveGroup).filter(ElectiveGroup.id == group_id).first()
        if not existing_group:
            raise HTTPException(status_code=404, detail="Elective group not found")

        existing_group.batch_id = group.batch_id
        existing_group.name = group.name

        db.commit()
        return {"message": "Elective group updated successfully"}
    finally:
        db.close()

@app.delete("/elective-groups/{group_id}")
def delete_elective_group(group_id: str):
    """Delete an elective group"""
    db = SessionLocal()
    try:
        group = db.query(ElectiveGroup).filter(ElectiveGroup.id == group_id).first()
        if not group:
            raise HTTPException(status_code=404, detail="Elective group not found")

        db.delete(group)
        db.commit()
        return {"message": "Elective group deleted successfully"}
    finally:
        db.close()

@app.post("/elective-enrollments")
def update_elective_enrollment(enrollment: ElectiveEnrollmentUpdate):
    """Create or update elective enrollment"""
    db = SessionLocal()
    try:
        existing = db.query(ElectiveEnrollment).filter(
            ElectiveEnrollment.elective_group_id == enrollment.elective_group_id,
            ElectiveEnrollment.subject_code == enrollment.subject_code
        ).first()

        if existing:
            existing.enrolled_students = enrollment.enrolled_students
        else:
            enrollment_id = str(uuid.uuid4())
            new_enrollment = ElectiveEnrollment(
                id=enrollment_id,
                elective_group_id=enrollment.elective_group_id,
                subject_code=enrollment.subject_code,
                enrolled_students=enrollment.enrolled_students
            )
            db.add(new_enrollment)
        db.commit()
        return {"message": "Enrollment updated successfully"}
    finally:
        db.close()

@app.get("/elective-groups/{group_id}/enrollments")
def get_group_enrollments(group_id: str):
    """Get all enrollments for an elective group"""
    db = SessionLocal()
    try:
        enrollments = db.query(ElectiveEnrollment).filter(ElectiveEnrollment.elective_group_id == group_id).all()
        return {"enrollments": [{"subject_code": e.subject_code, "enrolled_students": e.enrolled_students} for e in enrollments]}
    finally:
        db.close()


@app.get("/subject-dependencies")
def get_subject_dependencies():
    """Get all subject dependencies"""
    db = SessionLocal()
    try:
        dependencies = db.query(SubjectDependency).filter(SubjectDependency.is_active == True).all()
        return {"dependencies": [{
            "id": d.id,
            "subject_code": d.subject_code,
            "dependent_subject_code": d.dependent_subject_code,
            "dependency_type": d.dependency_type,
            "priority": d.priority,
            "gap_days": d.gap_days,
            "same_day": d.same_day
        } for d in dependencies]}
    finally:
        db.close()

@app.post("/subject-dependencies")
def create_subject_dependency(dependency: SubjectDependencyCreate):
    """Create a new subject dependency"""
    db = SessionLocal()
    try:

        existing = db.query(SubjectDependency).filter(
            SubjectDependency.subject_code == dependency.subject_code,
            SubjectDependency.dependent_subject_code == dependency.dependent_subject_code
        ).first()

        if existing:

            existing.dependency_type = dependency.dependency_type
            existing.priority = dependency.priority
            existing.gap_days = dependency.gap_days
            existing.same_day = dependency.same_day
            existing.is_active = True
            db.commit()
            return {"message": "Dependency updated successfully", "id": existing.id}

        dependency_id = str(uuid.uuid4())
        new_dependency = SubjectDependency(
            id=dependency_id,
            subject_code=dependency.subject_code,
            dependent_subject_code=dependency.dependent_subject_code,
            dependency_type=dependency.dependency_type,
            priority=dependency.priority,
            gap_days=dependency.gap_days,
            same_day=dependency.same_day,
            is_active=True
        )
        db.add(new_dependency)
        db.commit()
        return {"message": "Dependency created successfully", "id": dependency_id}
    finally:
        db.close()

@app.put("/subject-dependencies/{dependency_id}")
def update_subject_dependency(dependency_id: str, dependency: SubjectDependencyUpdate):
    """Update a subject dependency"""
    db = SessionLocal()
    try:
        existing = db.query(SubjectDependency).filter(SubjectDependency.id == dependency_id).first()
        if not existing:
            raise HTTPException(status_code=404, detail="Dependency not found")

        if dependency.dependency_type is not None:
            existing.dependency_type = dependency.dependency_type
        if dependency.priority is not None:
            existing.priority = dependency.priority
        if dependency.gap_days is not None:
            existing.gap_days = dependency.gap_days
        if dependency.same_day is not None:
            existing.same_day = dependency.same_day
        if dependency.is_active is not None:
            existing.is_active = dependency.is_active

        db.commit()
        return {"message": "Dependency updated successfully"}
    finally:
        db.close()

@app.delete("/subject-dependencies/{dependency_id}")
def delete_subject_dependency(dependency_id: str):
    """Delete a subject dependency"""
    db = SessionLocal()
    try:
        dependency = db.query(SubjectDependency).filter(SubjectDependency.id == dependency_id).first()
        if not dependency:
            raise HTTPException(status_code=404, detail="Dependency not found")

        dependency.is_active = False
        db.commit()
        return {"message": "Dependency deleted successfully"}
    finally:
        db.close()

@app.get("/batches/{batch_id}/subject-dependencies")
def get_batch_subject_dependencies(batch_id: str):
    """Get all subject dependencies for a batch"""
    db = SessionLocal()
    try:

        subjects = db.query(Subject).filter(Subject.batch_id == batch_id).all()
        subject_codes = [s.code for s in subjects]


        dependencies = db.query(SubjectDependency).filter(
            SubjectDependency.subject_code.in_(subject_codes),
            SubjectDependency.is_active == True
        ).all()

        return {"dependencies": [{
            "id": d.id,
            "subject_code": d.subject_code,
            "dependent_subject_code": d.dependent_subject_code,
            "dependency_type": d.dependency_type,
            "priority": d.priority,
            "gap_days": d.gap_days,
            "same_day": d.same_day
        } for d in dependencies]}
    finally:
        db.close()
