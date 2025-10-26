import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow import keras
from sklearn.preprocessing import LabelEncoder
import random
import json
import os
from datetime import datetime, timedelta
from utils import subject_teacher_mapping, data 

teacher_availability = {teacher: True for teacher in data["teachers"]}
teacher_subject_sections = {} 
teacher_sections_taught = {}
teacher_lecture_limits = {} 

subject_encoder = LabelEncoder()
teacher_encoder = LabelEncoder()

subject_encoder.fit(data["subjects"])
teacher_encoder.fit(data["teachers"])

model_path = "timetable_model.h5"
if os.path.exists(model_path):
    model = keras.models.load_model(model_path)
else:
    X_train, y_subjects_train, y_teachers_train = [], [], []
    for _ in range(5000):
        section = random.choice(data["sections"])
        day = random.choice(data["days"])
        time_slot = random.choice(data["time_slots"])
        subject = random.choice(data["subjects"])
        teacher = random.choice(subject_teacher_mapping[subject])
        X_train.append([data["sections"].index(section), data["time_slots"].index(time_slot)])
        y_subjects_train.append(subject_encoder.transform([subject])[0])
        y_teachers_train.append(teacher_encoder.transform([teacher])[0])

    X_train = np.array(X_train)
    y_subjects_train = np.array(y_subjects_train)
    y_teachers_train = np.array(y_teachers_train)

    inputs = keras.Input(shape=(2,))
    x = keras.layers.Dense(16, activation='relu')(inputs)
    x = keras.layers.Dense(32, activation='relu')(x)
    x = keras.layers.Dense(16, activation='relu')(x)
    subject_output = keras.layers.Dense(len(data["subjects"]), activation='softmax', name='subject_output')(x)
    teacher_output = keras.layers.Dense(len(data["teachers"]), activation='softmax', name='teacher_output')(x)
    model = keras.Model(inputs=inputs, outputs=[subject_output, teacher_output])

    model.compile(optimizer='adam',
                  loss={'subject_output': 'sparse_categorical_crossentropy', 'teacher_output': 'sparse_categorical_crossentropy'},
                  metrics={'subject_output': 'accuracy', 'teacher_output': 'accuracy'})
    model.fit(X_train, {'subject_output': y_subjects_train, 'teacher_output': y_teachers_train},
              epochs=10, batch_size=32, verbose=1)
    model.save(model_path)

def is_teacher_available_at_slot(teacher, day, time_slot, teacher_preferences):
    """Check if teacher is available based on their preferences"""
    if teacher not in teacher_preferences:
        return True
    
    prefs = teacher_preferences[teacher]
    
    # Check unavailable days
    if prefs.get("unavailable_days") and day in prefs["unavailable_days"]:
        return False
    
    # Check time window
    earliest = prefs.get("earliest_time")
    latest = prefs.get("latest_time")
    
    if earliest or latest:
        slot_start = time_slot.split("-")[0]
        
        if earliest and slot_start < earliest:
            return False
        if latest and slot_start >= latest:
            return False
    
    return True

def allocate_room(section, subject, time_slot, classrooms, room_assignments, section_sizes=None):
    """Allocate an appropriate room for a class"""
    if not classrooms:
        return None
    
    # Default section sizes (estimate)
    if not section_sizes:
        section_sizes = {}
    
    # Estimate section size (default 60 for regular sections, 30 for specialized)
    section_size = section_sizes.get(section, 60 if section in ["A", "B", "C", "D", "E", "F", "G", "H"] else 30)
    
    # Determine room type needed
    is_lab = subject.startswith("PCS")
    room_type_needed = "lab" if is_lab else "lecture"
    
    # Find available rooms - prioritize subject-specific rooms
    available_rooms = []
    subject_specific_rooms = []
    
    for room in classrooms:
        # Check if room type matches
        if room["room_type"] != room_type_needed:
            continue
        
        # Check if room has sufficient capacity
        if room["capacity"] < section_size:
            continue
        
        # Check if room is already occupied at this time
        room_key = f"{room['room_number']}"
        if room_key not in room_assignments:
            room_assignments[room_key] = {}
        
        # The room_assignments structure: {room_number: {day: {time_slot: section}}}
        # We'll check later when we know the day
        
        # Check if room has specific subject designation
        if "subjects" in room and room["subjects"] and len(room["subjects"]) > 0:
            # This room is designated for specific subjects
            if subject in room["subjects"]:
                # This subject is designated for this room - high priority!
                subject_specific_rooms.append(room)
            # else: skip this room, it's for other subjects
        else:
            # General purpose room - can be used for any subject
            available_rooms.append(room)
    
    # Prioritize subject-specific rooms first, then general purpose rooms
    priority_list = subject_specific_rooms + available_rooms
    
    if not priority_list:
        return None
    
    # Return the first suitable room from priority list
    return priority_list[0]["room_number"]

def is_room_available(room_number, day, time_slot, room_assignments):
    """Check if a room is available at a specific day and time"""
    if room_number not in room_assignments:
        return True
    if day not in room_assignments[room_number]:
        return True
    if time_slot not in room_assignments[room_number][day]:
        return True
    return False

def get_teacher_daily_lecture_count(timetable, teacher, day):
    """Count how many lectures a teacher has on a specific day"""
    count = 0
    for section in timetable:
        if day in timetable[section]:
            for time_slot in timetable[section][day]:
                if timetable[section][day][time_slot].get("teacher") == teacher:
                    count += 1
    return count

def get_teacher_weekly_lecture_count(timetable, teacher):
    """Count total lectures a teacher has in the week"""
    count = 0
    for section in timetable:
        for day in timetable[section]:
            for time_slot in timetable[section][day]:
                if timetable[section][day][time_slot].get("teacher") == teacher:
                    count += 1
    return count

def check_lecture_limits(timetable, teacher, day, is_two_hour=False):
    """Check if assigning this lecture violates lecture limits"""
    daily_count = get_teacher_daily_lecture_count(timetable, teacher, day)
    weekly_count = get_teacher_weekly_lecture_count(timetable, teacher)
    
    max_daily = 5 if weekly_count < 15 and daily_count < 4 else 4
    if daily_count + (2 if is_two_hour else 1) > max_daily:
        return False
    
    weekly_addition = 2 if is_two_hour else 1
    if weekly_count + weekly_addition > 15:
        return False
    
    return True

def check_slot_conflict(timetable, section, day, time_slot, teacher, subject, is_two_hour=False, teacher_subject_sections=None, teacher_lecture_limits=None, teacher_availability=None, teacher_preferences=None):
    if teacher_subject_sections is None:
        teacher_subject_sections = {}
    if teacher_lecture_limits is None:
        teacher_lecture_limits = {}
    if teacher_availability is None:
        teacher_availability = {}
    if teacher_preferences is None:
        teacher_preferences = {}
    
    if teacher in teacher_availability and not teacher_availability.get(teacher, True):
        return False
    
    # Check teacher preferences
    if not is_teacher_available_at_slot(teacher, day, time_slot, teacher_preferences):
        return False
    
    # Check lecture limits: max 4 per day (5 in special cases), max 15 per week
    if not check_lecture_limits(timetable, teacher, day, is_two_hour):
        return False
    
    slot_index = data["time_slots"].index(time_slot)
    if section not in timetable or day not in timetable[section]:
        return True
    
    if teacher in teacher_subject_sections and subject in teacher_subject_sections[teacher]:
        if section not in teacher_subject_sections[teacher][subject]:
            return False  
    
    for ts in timetable[section][day]:
        ts_index = data["time_slots"].index(ts)
        if ts == time_slot or (is_two_hour and slot_index + 1 < len(data["time_slots"]) and ts == data["time_slots"][slot_index + 1]):
            if timetable[section][day][ts]["teacher"] == teacher:
                return False
    
    if subject == "XCS-401" and is_two_hour:
        return False
    
    if is_two_hour and slot_index + 1 < len(data["time_slots"]):
        next_slot = data["time_slots"][slot_index + 1]
        if next_slot in timetable[section][day] and timetable[section][day][next_slot]["teacher"] == teacher:
            return False
        if slot_index > 0:
            prev_slot = data["time_slots"][slot_index - 1]
            if prev_slot in timetable[section][day] and timetable[section][day][prev_slot]["subject"] == "XCS-401":
                return False
    
    for sec in timetable:
        if sec != section and day in timetable[sec]:
            for ts in timetable[sec][day]:
                ts_index = data["time_slots"].index(ts)
                if ts == time_slot or (is_two_hour and slot_index + 1 < len(data["time_slots"]) and ts == data["time_slots"][slot_index + 1]):
                    if timetable[sec][day][ts]["teacher"] == teacher:
                        if teacher in teacher_subject_sections and subject in teacher_subject_sections[teacher]:
                            if sec in teacher_subject_sections[teacher][subject]:
                                return False
    return True

def generate_timetable(start_date=None, teacher_subject_sections=None, teacher_sections_taught=None, teacher_lecture_limits=None, teacher_availability=None, teacher_preferences=None, classrooms=None, course="BTech", semester=4):
    if not teacher_subject_sections:
        teacher_subject_sections = {}
    if not teacher_sections_taught:
        teacher_sections_taught = {}
    if not teacher_lecture_limits:
        teacher_lecture_limits = {}
    if not teacher_availability:
        teacher_availability = {teacher: True for teacher in data["teachers"]}
    if not teacher_preferences:
        teacher_preferences = {}
    if not classrooms:
        classrooms = []
    
    # Get subjects and sections dynamically based on course and semester
    from utils import get_subjects_for_semester, get_sections_for_course
    subjects = get_subjects_for_semester(course, semester)
    sections = get_sections_for_course(course)
    
    if not subjects:
        print(f"Warning: No subjects found for {course} semester {semester}")
        subjects = data["subjects"]  # Fallback to default
    
    if not sections:
        print(f"Warning: No sections found for {course}")
        sections = data["sections"]  # Fallback to default
    
    timetable = {}
    room_assignments = {}  # Track room allocations {room_number: {day: {time_slot: section}}}
    
    if start_date:
        start = datetime.strptime(start_date, "%Y-%m-%d")
    else:
        start = datetime.now()
    
    days = []
    current_date = start
    while len(days) < 6:
        if current_date.weekday() != 6:
            days.append(current_date.strftime("%A"))
        current_date += timedelta(days=1)
    
    elective_slots = ["11:00-12:00", "12:00-13:00"]
    lunch_slot = "13:00-14:00"
    elective_days = random.sample(days, 2)
    
    # Dynamically determine lab subjects (typically PCS subjects)
    lab_subjects = [s for s in subjects if s.startswith("PCS") or "lab" in s.lower() or "practical" in s.lower()]
    
    # Core subjects are all except lab, elective, and project
    core_subjects_all = [s for s in subjects if s not in lab_subjects and s != "Elective" and s != "Project"]
    
    # Special subjects for specific sections (maintain for BTech compatibility)
    exclusive_subjects = {
        "DS1": [s for s in subjects if "DP900" in s or "data" in s.lower()],
        "DS2": [s for s in subjects if "DP900" in s or "data" in s.lower()],
        "ML1": [s for s in subjects if "AI900" in s or "ml" in s.lower() or "ai" in s.lower()],
        "ML2": [s for s in subjects if "AI900" in s or "ml" in s.lower() or "ai" in s.lower()],
        "Cyber": [s for s in subjects if "NDE" in s or "cyber" in s.lower() or "security" in s.lower()],
        "AI": [s for s in subjects if "AI900" in s or "ai" in s.lower()]
    }
    
    # Clean up exclusive subjects - only keep sections that have exclusive subjects
    exclusive_subjects = {k: v for k, v in exclusive_subjects.items() if v and k in sections}
    
    morning_slots = ["8:00-9:00", "9:00-10:00", "10:00-11:00", "11:00-12:00", "12:00-13:00"]
    afternoon_slots = ["14:00-15:00", "15:00-16:00"]
    lunch_slot = "13:00-14:00"

    for section in sections:
        timetable[section] = {day: {} for day in days}

    for section in sections:
        for elective_day in elective_days:
            available_teachers = [t for t in subject_teacher_mapping["Elective"] if teacher_availability.get(t, True)]
            if available_teachers:
                teacher = random.choice(available_teachers)
                if check_slot_conflict(timetable, section, elective_day, elective_slots[0], teacher, subject="Elective", is_two_hour=True, teacher_subject_sections=teacher_subject_sections, teacher_lecture_limits=teacher_lecture_limits, teacher_availability=teacher_availability, teacher_preferences=teacher_preferences):
                    # Allocate room for elective
                    room = None
                    if classrooms:
                        for classroom in classrooms:
                            if classroom["room_type"] == "lecture" and is_room_available(classroom["room_number"], elective_day, elective_slots[0], room_assignments):
                                room = classroom["room_number"]
                                # Mark room as occupied
                                if room not in room_assignments:
                                    room_assignments[room] = {}
                                if elective_day not in room_assignments[room]:
                                    room_assignments[room][elective_day] = {}
                                room_assignments[room][elective_day][elective_slots[0]] = section
                                room_assignments[room][elective_day][elective_slots[1]] = section
                                break
                    
                    timetable[section][elective_day][elective_slots[0]] = {"subject": "Elective", "teacher": "respective teacher", "room": room}
                    timetable[section][elective_day][elective_slots[1]] = {"subject": "Elective", "teacher": "respective teacher", "room": room}
    
    for section in sections:
        base_subjects = core_subjects_all.copy()
        core_pool = base_subjects + (exclusive_subjects.get(section, []))
        
        lab_occurrences = {lab: 0 for lab in lab_subjects}
        
        for lab_subject in lab_subjects:
            occurrences_scheduled = 0
            attempts = 0
            
            while occurrences_scheduled < 2 and attempts < 50:
                attempts += 1
                day = random.choice(days)
                
                for time_slot in morning_slots:
                    if day in elective_days and time_slot in elective_slots:
                        continue
                        
                    slot_index = data["time_slots"].index(time_slot)
                    if slot_index + 1 < len(data["time_slots"]):
                        next_slot = data["time_slots"][slot_index + 1]
                        
                        if (time_slot not in timetable[section][day] and 
                            next_slot not in timetable[section][day] and
                            next_slot in morning_slots):
                            
                            valid_teachers = [
                                t for t in subject_teacher_mapping[lab_subject] 
                                if teacher_availability.get(t, True)
                                and t in teacher_subject_sections 
                                and lab_subject in teacher_subject_sections[t] 
                                and section in teacher_subject_sections[t][lab_subject]
                            ]
                            
                            if valid_teachers:
                                teacher = random.choice(valid_teachers)
                                if check_slot_conflict(timetable, section, day, time_slot, teacher, lab_subject, is_two_hour=True, teacher_subject_sections=teacher_subject_sections, teacher_lecture_limits=teacher_lecture_limits, teacher_availability=teacher_availability, teacher_preferences=teacher_preferences):
                                    # Allocate lab room
                                    room = None
                                    if classrooms:
                                        for classroom in classrooms:
                                            if classroom["room_type"] == "lab" and is_room_available(classroom["room_number"], day, time_slot, room_assignments):
                                                room = classroom["room_number"]
                                                # Mark room as occupied
                                                if room not in room_assignments:
                                                    room_assignments[room] = {}
                                                if day not in room_assignments[room]:
                                                    room_assignments[room][day] = {}
                                                room_assignments[room][day][time_slot] = section
                                                room_assignments[room][day][next_slot] = section
                                                break
                                    
                                    timetable[section][day][time_slot] = {"subject": lab_subject, "teacher": teacher, "room": room}
                                    timetable[section][day][next_slot] = {"subject": lab_subject, "teacher": teacher, "room": room}
                                    occurrences_scheduled += 1
                                    lab_occurrences[lab_subject] += 1
                                    if teacher not in teacher_sections_taught:
                                        teacher_sections_taught[teacher] = []
                                    if section not in teacher_sections_taught[teacher]:
                                        teacher_sections_taught[teacher].append(section)
                                    break
                
                if occurrences_scheduled >= 2:
                    break
        
        for day in days:
            for time_slot in morning_slots:
                if day in elective_days and time_slot in elective_slots:
                    continue
                
                if time_slot in timetable[section][day]:
                    continue
                
                theory_subjects = [s for s in core_pool if not s.startswith("PCS")]
                if theory_subjects:
                    subject = random.choice(theory_subjects)
                    
                    valid_teachers = [
                        t for t in subject_teacher_mapping[subject] 
                        if teacher_availability.get(t, True)
                        and t in teacher_subject_sections 
                        and subject in teacher_subject_sections[t] 
                        and section in teacher_subject_sections[t][subject]
                    ]
                    
                    if valid_teachers:
                        teacher = random.choice(valid_teachers)
                        if check_slot_conflict(timetable, section, day, time_slot, teacher, subject, is_two_hour=False, teacher_subject_sections=teacher_subject_sections, teacher_lecture_limits=teacher_lecture_limits, teacher_availability=teacher_availability, teacher_preferences=teacher_preferences):
                            # Allocate lecture room
                            room = None
                            if classrooms:
                                for classroom in classrooms:
                                    if classroom["room_type"] == "lecture" and is_room_available(classroom["room_number"], day, time_slot, room_assignments):
                                        room = classroom["room_number"]
                                        # Mark room as occupied
                                        if room not in room_assignments:
                                            room_assignments[room] = {}
                                        if day not in room_assignments[room]:
                                            room_assignments[room][day] = {}
                                        room_assignments[room][day][time_slot] = section
                                        break
                            
                            timetable[section][day][time_slot] = {"subject": subject, "teacher": teacher, "room": room}
                            if teacher not in teacher_sections_taught:
                                teacher_sections_taught[teacher] = []
                            if section not in teacher_sections_taught[teacher]:
                                teacher_sections_taught[teacher].append(section)
        
        total_morning_slots = sum(1 for day in days for ts in morning_slots 
                                if ts in timetable[section][day] and timetable[section][day][ts]["subject"] != "Lunch")
        
        needs_afternoon = total_morning_slots < 20
        
        if needs_afternoon:
            for day in days:
                timetable[section][day][lunch_slot] = {"subject": "Lunch", "teacher": None, "room": None}
            
            for day in days:
                for time_slot in afternoon_slots:
                    total_slots_filled = sum(1 for d in days for ts in timetable[section][d] 
                                           if ts != lunch_slot and timetable[section][d][ts]["subject"] != "Lunch")
                    
                    if total_slots_filled >= 25:
                        break
                    
                    if time_slot not in timetable[section][day]:
                        subject = random.choice(core_pool)
                        
                        valid_teachers = [
                            t for t in subject_teacher_mapping[subject] 
                            if teacher_availability.get(t, True)
                            and t in teacher_subject_sections 
                            and subject in teacher_subject_sections[t] 
                            and section in teacher_subject_sections[t][subject]
                        ]
                        
                        if valid_teachers:
                            teacher = random.choice(valid_teachers)
                            if check_slot_conflict(timetable, section, day, time_slot, teacher, subject, is_two_hour=False, teacher_subject_sections=teacher_subject_sections, teacher_lecture_limits=teacher_lecture_limits, teacher_availability=teacher_availability, teacher_preferences=teacher_preferences):
                                # Allocate lecture room
                                room = None
                                if classrooms:
                                    for classroom in classrooms:
                                        if classroom["room_type"] == "lecture" and is_room_available(classroom["room_number"], day, time_slot, room_assignments):
                                            room = classroom["room_number"]
                                            # Mark room as occupied
                                            if room not in room_assignments:
                                                room_assignments[room] = {}
                                            if day not in room_assignments[room]:
                                                room_assignments[room][day] = {}
                                            room_assignments[room][day][time_slot] = section
                                            break
                                
                                timetable[section][day][time_slot] = {"subject": subject, "teacher": teacher, "room": room}
                                if teacher not in teacher_sections_taught:
                                    teacher_sections_taught[teacher] = []
                                if section not in teacher_sections_taught[teacher]:
                                    teacher_sections_taught[teacher].append(section)

    for teacher in list(teacher_sections_taught.keys()):
        current_sections = set()
        for section in sections:
            if section in timetable and any(slot["teacher"] == teacher for day in timetable[section].values() for slot in day.values() if slot["teacher"] != "respective teacher"):
                current_sections.add(section)
        if current_sections:
            teacher_sections_taught[teacher] = list(current_sections)
        else:
            del teacher_sections_taught[teacher]

    print("Final teacher_sections_taught:", teacher_sections_taught)
    print("Final teacher_subject_sections:", teacher_subject_sections)
    print("Final teacher_lecture_limits:", teacher_lecture_limits)
    
    # Print final lecture counts per teacher to verify constraints
    for teacher in data["teachers"]:
        daily_counts = {}
        for day in days:
            daily_counts[day] = get_teacher_daily_lecture_count(timetable, teacher, day)
        weekly_count = get_teacher_weekly_lecture_count(timetable, teacher)
        print(f"{teacher}: {weekly_count} total lectures, daily: {daily_counts}")
    
    return timetable

if __name__ == "__main__":
    timetable = generate_timetable()
    print(json.dumps(timetable, indent=4))
