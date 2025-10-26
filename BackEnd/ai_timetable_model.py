import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow import keras
from sklearn.preprocessing import LabelEncoder
import random
import json
import os
from datetime import datetime, timedelta


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

teacher_availability = {}
teacher_subject_sections = {}
teacher_sections_taught = {}
teacher_lecture_limits = {}

subject_encoder = None
teacher_encoder = None

def _initialize_encoders():
    """Initialize encoders lazily when needed"""
    global subject_encoder, teacher_encoder
    if subject_encoder is None or teacher_encoder is None:
        subject_encoder = LabelEncoder()
        teacher_encoder = LabelEncoder()
        subject_encoder.fit(data["subjects"])
        teacher_encoder.fit(data["teachers"])
        print(f"Initialized encoders: {len(data['subjects'])} subjects, {len(data['teachers'])} teachers")
    return subject_encoder, teacher_encoder

def _reinitialize_encoders():
    """Reinitialize encoders with current teacher list"""
    global subject_encoder, teacher_encoder
    subject_encoder = LabelEncoder()
    teacher_encoder = LabelEncoder()
    subject_encoder.fit(data["subjects"])
    teacher_encoder.fit(data["teachers"])
    print(f"Reinitialized encoders: {len(data['subjects'])} subjects, {len(data['teachers'])} teachers")
    return subject_encoder, teacher_encoder

model_path = "timetable_model.h5"
model = None

def _load_or_create_model():
    """Lazy-load or create model when needed with actual data"""
    global model

    if model is not None:
        return model

    if os.path.exists(model_path):
        model = keras.models.load_model(model_path)
        print(f"Loaded existing model from {model_path}")
    else:

        if not data["teachers"] or len(data["teachers"]) == 0:
            raise ValueError("Cannot create model: No teachers available. Please add teachers first.")

        if not data["subjects"] or len(data["subjects"]) == 0:
            raise ValueError("Cannot create model: No subjects available. Please add subjects first.")

        if not data["sections"] or len(data["sections"]) == 0:
            raise ValueError("Cannot create model: No sections available. Please add sections first.")

        print("Training new model with current data...")
        X_train, y_subjects_train, y_teachers_train = [], [], []
        for _ in range(5000):
            section = random.choice(data["sections"])
            day = random.choice(data["days"])
            time_slot = random.choice(data["time_slots"])
            subject = random.choice(data["subjects"])


            if subject in subject_teacher_mapping and len(subject_teacher_mapping[subject]) > 0:
                teacher = random.choice(subject_teacher_mapping[subject])
            else:
                teacher = random.choice(data["teachers"])

            X_train.append([data["sections"].index(section), data["time_slots"].index(time_slot)])
            subj_enc, teach_enc = _initialize_encoders()
            y_subjects_train.append(subj_enc.transform([subject])[0])
            y_teachers_train.append(teach_enc.transform([teacher])[0])

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
        print(f"Model trained and saved to {model_path}")

    return model

def is_teacher_available_at_slot(teacher, day, time_slot, teacher_preferences):
    """Check if teacher is available based on their preferences"""
    if teacher not in teacher_preferences:
        return True

    prefs = teacher_preferences[teacher]


    if prefs.get("unavailable_days") and day in prefs["unavailable_days"]:
        return False


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


    if not section_sizes:
        section_sizes = {}


    section_size = section_sizes.get(section, 60 if section in ["A", "B", "C", "D", "E", "F", "G", "H"] else 30)


    is_lab = subject.startswith("PCS")
    room_type_needed = "lab" if is_lab else "lecture"


    available_rooms = []
    subject_specific_rooms = []

    for room in classrooms:

        if room["room_type"] != room_type_needed:
            continue


        if room["capacity"] < section_size:
            continue


        room_key = f"{room['room_number']}"
        if room_key not in room_assignments:
            room_assignments[room_key] = {}




        if "subjects" in room and room["subjects"] and len(room["subjects"]) > 0:

            if subject in room["subjects"]:

                subject_specific_rooms.append(room)

        else:

            available_rooms.append(room)


    priority_list = subject_specific_rooms + available_rooms

    if not priority_list:
        return None


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


    if not is_teacher_available_at_slot(teacher, day, time_slot, teacher_preferences):
        return False


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
    from backend_api import SessionLocal, ElectiveEnrollment, SubjectDependency


    if not data["teachers"] or len(data["teachers"]) == 0:
        raise ValueError("No teachers available in the system. Please add teachers through the Teacher Management UI.")

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


    from backend_api import get_subjects_for_semester, get_sections_for_course
    subjects = get_subjects_for_semester(course, semester)
    sections = get_sections_for_course(course)

    if not subjects:
        print(f"Warning: No subjects found for {course} semester {semester}")
        subjects = data["subjects"]

    if not sections:
        print(f"Warning: No sections found for {course}")
        sections = data["sections"]


    db = SessionLocal()
    subject_dependencies = {}
    try:
        deps = db.query(SubjectDependency).filter(SubjectDependency.is_active == True).all()
        for dep in deps:
            if dep.subject_code not in subject_dependencies:
                subject_dependencies[dep.subject_code] = []
            subject_dependencies[dep.subject_code].append({
                "dependent": dep.dependent_subject_code,
                "type": dep.dependency_type,
                "priority": dep.priority,
                "gap_days": dep.gap_days,
                "same_day": dep.same_day
            })
        print(f"Loaded {len(deps)} subject dependencies")
    finally:
        db.close()

    timetable = {}
    room_assignments = {}

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



    lunch_slot = "13:00-14:00"


    elective_days = random.sample([d for d in days if d not in ["Saturday"]], 2)


    elective_time_pairs = [
        ("11:00-12:00", "12:00-13:00"),
        ("14:00-15:00", "15:00-16:00")
    ]
    selected_elective_slots = random.choice(elective_time_pairs)


    lab_subjects = [s for s in subjects if s.startswith("PCS") or "lab" in s.lower() or "practical" in s.lower()]


    core_subjects_all = [s for s in subjects if s not in lab_subjects and s != "Elective" and s != "Project"]


    exclusive_subjects = {
        "DS1": [s for s in subjects if "DP900" in s or "data" in s.lower()],
        "DS2": [s for s in subjects if "DP900" in s or "data" in s.lower()],
        "ML1": [s for s in subjects if "AI900" in s or "ml" in s.lower() or "ai" in s.lower()],
        "ML2": [s for s in subjects if "AI900" in s or "ml" in s.lower() or "ai" in s.lower()],
        "Cyber": [s for s in subjects if "NDE" in s or "cyber" in s.lower() or "security" in s.lower()],
        "AI": [s for s in subjects if "AI900" in s or "ai" in s.lower()]
    }


    exclusive_subjects = {k: v for k, v in exclusive_subjects.items() if v and k in sections}

    morning_slots = ["8:00-9:00", "9:00-10:00", "10:00-11:00", "11:00-12:00", "12:00-13:00"]
    afternoon_slots = ["14:00-15:00", "15:00-16:00"]
    lunch_slot = "13:00-14:00"

    for section in sections:
        timetable[section] = {day: {} for day in days}




    elective_groups_data = {}
    db = SessionLocal()
    try:

        elective_enrollments = db.query(ElectiveEnrollment).all()


        for enrollment in elective_enrollments:
            group_id = enrollment.elective_group_id
            if group_id not in elective_groups_data:
                elective_groups_data[group_id] = {"total_students": 0, "subjects": []}
            elective_groups_data[group_id]["total_students"] += enrollment.enrolled_students
            if enrollment.subject_code not in elective_groups_data[group_id]["subjects"]:
                elective_groups_data[group_id]["subjects"].append(enrollment.subject_code)
    finally:
        db.close()



    lt_counter = 1
    max_cr_capacity = 60


    if elective_groups_data:

        for group_id, group_data in elective_groups_data.items():
            total_students = group_data["total_students"]


            if total_students > 100:

                allocated_rooms = [f"LT{lt_counter}"]
                lt_counter += 1
                remaining_students = total_students - 100


                if remaining_students > 0:
                    additional_lts = (remaining_students // 100) + 1
                    for i in range(additional_lts):
                        allocated_rooms.append(f"LT{lt_counter}")
                        lt_counter += 1
            elif total_students > max_cr_capacity:

                allocated_rooms = [f"LT{lt_counter}"]
                lt_counter += 1
            else:

                allocated_rooms = ["CR1"]


            for section in sections:
                for elective_day in elective_days:

                    for slot_pair in selected_elective_slots:
                        if not timetable[section][elective_day].get(slot_pair):
                            timetable[section][elective_day][slot_pair] = {
                                "subject": f"Elective Group {group_id}",
                                "teacher": "Elective Faculty",
                                "room": allocated_rooms[0] if allocated_rooms else None,
                                "elective_subjects": group_data["subjects"],
                                "total_students": total_students
                            }

                            if allocated_rooms[0] and allocated_rooms[0] not in room_assignments:
                                room_assignments[allocated_rooms[0]] = {}
                            if allocated_rooms[0] and elective_day not in room_assignments[allocated_rooms[0]]:
                                room_assignments[allocated_rooms[0]][elective_day] = {}
                            if allocated_rooms[0]:
                                room_assignments[allocated_rooms[0]][elective_day][slot_pair] = section

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

                    if day in elective_days and time_slot in selected_elective_slots:
                        continue

                    slot_index = data["time_slots"].index(time_slot)
                    if slot_index + 1 < len(data["time_slots"]):
                        next_slot = data["time_slots"][slot_index + 1]

                        if (time_slot not in timetable[section][day] and
                            next_slot not in timetable[section][day] and
                            next_slot in morning_slots):

                            valid_teachers = [
                                t for t in (subject_teacher_mapping.get(lab_subject, []))
                                        if teacher_availability.get(t, True)
                                        and t in teacher_subject_sections
                                        and lab_subject in teacher_subject_sections[t]
                                        and section in teacher_subject_sections[t][lab_subject]
                                    ]

                            if valid_teachers:
                                teacher = random.choice(valid_teachers)
                                if check_slot_conflict(timetable, section, day, time_slot, teacher, lab_subject, is_two_hour=True, teacher_subject_sections=teacher_subject_sections, teacher_lecture_limits=teacher_lecture_limits, teacher_availability=teacher_availability, teacher_preferences=teacher_preferences):

                                    room = None
                                    if classrooms:
                                        for classroom in classrooms:
                                            if classroom["room_type"] == "lab" and is_room_available(classroom["room_number"], day, time_slot, room_assignments):
                                                room = classroom["room_number"]

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

                if day in elective_days and time_slot in selected_elective_slots:
                    continue

                if time_slot in timetable[section][day]:
                    continue

                theory_subjects = [s for s in core_pool if not s.startswith("PCS")]
                if theory_subjects:

                    prioritized_subjects = []
                    for subj in theory_subjects:

                        has_unsatisfied_prereq = False
                        if subj in subject_dependencies:
                            for dep in subject_dependencies[subj]:
                                if dep["type"] == "prerequisite":

                                    prereq = dep["dependent"]
                                    prereq_scheduled = False
                                    for d in days:
                                        for ts in timetable[section][d]:
                                            if timetable[section][d][ts].get("subject") == prereq:
                                                prereq_scheduled = True
                                                break
                                        if prereq_scheduled:
                                            break
                                    if not prereq_scheduled:
                                        has_unsatisfied_prereq = True
                                        break


                        current_day_index = days.index(day)
                        is_late_in_week = current_day_index >= 3
                        if not has_unsatisfied_prereq or is_late_in_week:
                            prioritized_subjects.append(subj)

                    if prioritized_subjects:
                        subject = random.choice(prioritized_subjects)
                    else:
                        subject = random.choice(theory_subjects)



                    recent_subjects = []
                    for past_day in days[:days.index(day)+1]:
                        if past_day != day:
                            for ts in timetable[section][past_day]:
                                subj = timetable[section][past_day][ts].get("subject", "")
                                if subj and subj != "Lunch" and subj != "Elective":
                                    recent_subjects.append(subj)


                    if recent_subjects and len(prioritized_subjects) > 1:

                        grouped_subjects = []
                        for rs in recent_subjects[-2:]:
                            for ps in prioritized_subjects:

                                if rs.split("-")[0] == ps.split("-")[0]:
                                    grouped_subjects.append(ps)
                        if grouped_subjects:
                            subject = random.choice(grouped_subjects)
                        else:
                            subject = random.choice(prioritized_subjects)



                    current_time = time_slot.split("-")[0]
                    current_day_index = days.index(day)


                    is_morning_peak = current_time in ["9:00", "10:00", "11:00"]

                    is_post_lunch = current_time in ["13:00", "14:00"]

                    is_late_afternoon = current_time in ["15:00", "16:00"]

                    is_monday_morning = day == "Monday" and is_morning_peak

                    is_friday_afternoon = day == "Friday" and (is_late_afternoon or current_time in ["14:00"])


                    cognitively_appropriate_subjects = prioritized_subjects.copy() if prioritized_subjects else theory_subjects.copy()


                    if is_monday_morning:
                        cognitively_appropriate_subjects = [s for s in cognitively_appropriate_subjects if True]


                    elif is_morning_peak:
                        cognitively_appropriate_subjects = cognitively_appropriate_subjects


                    elif is_post_lunch:
                        cognitively_appropriate_subjects = cognitively_appropriate_subjects


                    elif is_late_afternoon:
                        cognitively_appropriate_subjects = cognitively_appropriate_subjects


                    elif is_friday_afternoon:
                        cognitively_appropriate_subjects = cognitively_appropriate_subjects

                    if cognitively_appropriate_subjects:
                        subject = random.choice(cognitively_appropriate_subjects)
                    elif prioritized_subjects:
                        subject = random.choice(prioritized_subjects)
                    else:
                        subject = random.choice(theory_subjects)

                    valid_teachers = [
                        t for t in (subject_teacher_mapping.get(subject, []))
                        if teacher_availability.get(t, True)
                        and t in teacher_subject_sections
                        and subject in teacher_subject_sections[t]
                        and section in teacher_subject_sections[t][subject]
                    ]

                    if valid_teachers:
                        teacher = random.choice(valid_teachers)
                        if check_slot_conflict(timetable, section, day, time_slot, teacher, subject, is_two_hour=False, teacher_subject_sections=teacher_subject_sections, teacher_lecture_limits=teacher_lecture_limits, teacher_availability=teacher_availability, teacher_preferences=teacher_preferences):

                            room = None
                            if classrooms:
                                for classroom in classrooms:
                                    if classroom["room_type"] == "lecture" and is_room_available(classroom["room_number"], day, time_slot, room_assignments):
                                        room = classroom["room_number"]

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
                            t for t in (subject_teacher_mapping.get(subject, []))
                            if teacher_availability.get(t, True)
                            and t in teacher_subject_sections
                            and subject in teacher_subject_sections[t]
                            and section in teacher_subject_sections[t][subject]
                        ]

                        if valid_teachers:
                            teacher = random.choice(valid_teachers)
                            if check_slot_conflict(timetable, section, day, time_slot, teacher, subject, is_two_hour=False, teacher_subject_sections=teacher_subject_sections, teacher_lecture_limits=teacher_lecture_limits, teacher_availability=teacher_availability, teacher_preferences=teacher_preferences):

                                room = None
                                if classrooms:
                                    for classroom in classrooms:
                                        if classroom["room_type"] == "lecture" and is_room_available(classroom["room_number"], day, time_slot, room_assignments):
                                            room = classroom["room_number"]

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
