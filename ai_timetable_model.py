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

def check_slot_conflict(timetable, section, day, time_slot, teacher, subject, is_two_hour=False, teacher_subject_sections=None, teacher_lecture_limits=None):
    if teacher_subject_sections is None:
        teacher_subject_sections = {}
    if teacher_lecture_limits is None:
        teacher_lecture_limits = {}
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

def generate_timetable(start_date=None, teacher_subject_sections=None, teacher_sections_taught=None, teacher_lecture_limits=None):
    if not teacher_subject_sections:
        teacher_subject_sections = {}
    if not teacher_sections_taught:
        teacher_sections_taught = {}
    if not teacher_lecture_limits:
        teacher_lecture_limits = {}
    timetable = {}
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
    elective_day = random.choice(days)
    lab_subjects = ["PCS-408", "PCS-403", "PCS-409"]
    core_subjects_all = ["TCS-408", "TCS-402", "TCS-403", "TCS-409", "XCS-401", "TOC-401"]
    exclusive_subjects = {
        "DS1": ["DP900"],
        "DS2": ["DP900"],
        "ML1": ["AI900"],
        "ML2": ["AI900"],
        "Cyber": ["NDE"],
        "AI": ["AI900"]
    }

    for section in data["sections"]:
        timetable[section] = {day: {} for day in days}

    for section in data["sections"]:
        available_teachers = [t for t, avail in teacher_availability.items() if avail]
        valid_teachers = [t for t in subject_teacher_mapping["Elective"] if t in available_teachers]
        if valid_teachers:
            teacher = random.choice(valid_teachers)
            if check_slot_conflict(timetable, section, elective_day, elective_slots[0], teacher, subject="Elective", is_two_hour=True, teacher_subject_sections=teacher_subject_sections, teacher_lecture_limits=teacher_lecture_limits):
                timetable[section][elective_day][elective_slots[0]] = {"subject": "Elective", "teacher": "respective teacher"}
                timetable[section][elective_day][elective_slots[1]] = {"subject": "Elective", "teacher": "respective teacher"}

    teacher_lecture_count = {t: 0 for t in data["teachers"]}  
    for section in data["sections"]:
        base_subjects = core_subjects_all + lab_subjects
        core_pool = base_subjects + (exclusive_subjects.get(section, []))
        labs_to_schedule = [s for s in lab_subjects if s in core_pool]
        labs_assigned = []

        for day in days:
            time_slots = data["time_slots"]
            for time_slot in time_slots:
                if time_slot == lunch_slot:
                    timetable[section][day][time_slot] = {"subject": "Lunch", "teacher": None}
                    continue

                if day == elective_day and time_slot in elective_slots:
                    continue

                available_teachers = [t for t, avail in teacher_availability.items() if avail]
                scheduled = False

                if labs_to_schedule and random.random() < 0.3:  
                    subject = random.choice(labs_to_schedule)
                    is_lab = True
                    next_slot = data["time_slots"][data["time_slots"].index(time_slot) + 1] if time_slot != "15:00-16:00" else None
                    valid_teachers = [
                        t for t in subject_teacher_mapping[subject] 
                        if t in available_teachers 
                        and t in teacher_subject_sections 
                        and subject in teacher_subject_sections[t] 
                        and section in teacher_subject_sections[t][subject]
                        and (teacher_lecture_count.get(t, 0) + 2) <= (teacher_lecture_limits.get(t, float('inf')))
                    ]
                    if valid_teachers and next_slot:
                        teacher = random.choice(valid_teachers)
                        if check_slot_conflict(timetable, section, day, time_slot, teacher, subject, is_two_hour=True, teacher_subject_sections=teacher_subject_sections, teacher_lecture_limits=teacher_lecture_limits):
                            timetable[section][day][time_slot] = {"subject": subject, "teacher": teacher}
                            timetable[section][day][next_slot] = {"subject": subject, "teacher": teacher}
                            labs_to_schedule.remove(subject)
                            labs_assigned.append(subject)
                            teacher_lecture_count[teacher] += 2
                            if teacher not in teacher_sections_taught:
                                teacher_sections_taught[teacher] = []
                            if section not in teacher_sections_taught[teacher]:
                                teacher_sections_taught[teacher].append(section)
                            scheduled = True

                if not scheduled:
                    subject = random.choice(core_pool)
                    is_lab = False
                    valid_teachers = [
                        t for t in subject_teacher_mapping[subject] 
                        if t in available_teachers 
                        and t in teacher_subject_sections 
                        and subject in teacher_subject_sections[t] 
                        and section in teacher_subject_sections[t][subject]
                        and (teacher_lecture_count.get(t, 0) + 1) <= (teacher_lecture_limits.get(t, float('inf')))
                    ]
                    if valid_teachers:
                        teacher = random.choice(valid_teachers)
                        if check_slot_conflict(timetable, section, day, time_slot, teacher, subject, is_two_hour=False, teacher_subject_sections=teacher_subject_sections, teacher_lecture_limits=teacher_lecture_limits):
                            timetable[section][day][time_slot] = {"subject": subject, "teacher": teacher}
                            teacher_lecture_count[teacher] += 1
                            if teacher not in teacher_sections_taught:
                                teacher_sections_taught[teacher] = []
                            if section not in teacher_sections_taught[teacher]:
                                teacher_sections_taught[teacher].append(section)
                            scheduled = True

    for teacher, limit in teacher_lecture_limits.items():
        if limit is not None and limit > 0: 
            current_lectures = teacher_lecture_count.get(teacher, 0)
            if current_lectures != limit:
                if current_lectures < limit:
                    for section in data["sections"]:
                        for day in days:
                            for time_slot in data["time_slots"]:
                                if time_slot == lunch_slot or (day == elective_day and time_slot in elective_slots):
                                    continue
                                if timetable[section][day].get(time_slot, {}).get("teacher") is None:
                                    subject = random.choice(core_subjects_all + lab_subjects + (exclusive_subjects.get(section, [])))
                                    if teacher in subject_teacher_mapping[subject] and teacher in teacher_subject_sections and subject in teacher_subject_sections[teacher] and section in teacher_subject_sections[teacher][subject]:
                                        if check_slot_conflict(timetable, section, day, time_slot, teacher, subject, is_two_hour=False, teacher_subject_sections=teacher_subject_sections, teacher_lecture_limits=teacher_lecture_limits):
                                            timetable[section][day][time_slot] = {"subject": subject, "teacher": teacher}
                                            teacher_lecture_count[teacher] += 1
                                            if teacher_lecture_count[teacher] == limit:
                                                break
                                if teacher_lecture_count.get(teacher, 0) >= limit:
                                    break
                            if teacher_lecture_count.get(teacher, 0) >= limit:
                                break
                        if teacher_lecture_count.get(teacher, 0) >= limit:
                            break
                elif current_lectures > limit:
                    excess = current_lectures - limit
                    for section in data["sections"]:
                        for day in days:
                            for time_slot in data["time_slots"]:
                                if timetable[section][day].get(time_slot, {}).get("teacher") == teacher and excess > 0:
                                    del timetable[section][day][time_slot]
                                    teacher_lecture_count[teacher] -= 1
                                    excess -= 1
                                    if excess == 0:
                                        break
                            if excess == 0:
                                break
                        if excess == 0:
                            break

    for teacher in list(teacher_sections_taught.keys()):
        current_sections = set()
        for section in data["sections"]:
            if section in timetable and any(slot["teacher"] == teacher for day in timetable[section].values() for slot in day.values() if slot["teacher"] != "respective teacher"):
                current_sections.add(section)
        if current_sections:
            teacher_sections_taught[teacher] = list(current_sections)
        else:
            del teacher_sections_taught[teacher]

    print("Final teacher_sections_taught:", teacher_sections_taught)
    print("Final teacher_subject_sections:", teacher_subject_sections)
    print("Final teacher_lecture_limits:", teacher_lecture_limits)
    print("Final lecture counts:", teacher_lecture_count)
    return timetable

if __name__ == "__main__":
    timetable = generate_timetable()
    print(json.dumps(timetable, indent=4))
