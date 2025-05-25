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

def check_slot_conflict(timetable, section, day, time_slot, teacher, subject, is_two_hour=False, teacher_subject_sections=None, teacher_lecture_limits=None, teacher_availability=None):
    if teacher_subject_sections is None:
        teacher_subject_sections = {}
    if teacher_lecture_limits is None:
        teacher_lecture_limits = {}
    if teacher_availability is None:
        teacher_availability = {}
    
    if teacher in teacher_availability and not teacher_availability.get(teacher, True):
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

def generate_timetable(start_date=None, teacher_subject_sections=None, teacher_sections_taught=None, teacher_lecture_limits=None, teacher_availability=None):
    if not teacher_subject_sections:
        teacher_subject_sections = {}
    if not teacher_sections_taught:
        teacher_sections_taught = {}
    if not teacher_lecture_limits:
        teacher_lecture_limits = {}
    if not teacher_availability:
        teacher_availability = {teacher: True for teacher in data["teachers"]}
    
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
    elective_days = random.sample(days, 2)
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
    
    morning_slots = ["8:00-9:00", "9:00-10:00", "10:00-11:00", "11:00-12:00", "12:00-13:00"]
    afternoon_slots = ["14:00-15:00", "15:00-16:00"]
    lunch_slot = "13:00-14:00"

    for section in data["sections"]:
        timetable[section] = {day: {} for day in days}

    for section in data["sections"]:
        for elective_day in elective_days:
            available_teachers = [t for t in subject_teacher_mapping["Elective"] if teacher_availability.get(t, True)]
            if available_teachers:
                teacher = random.choice(available_teachers)
                if check_slot_conflict(timetable, section, elective_day, elective_slots[0], teacher, subject="Elective", is_two_hour=True, teacher_subject_sections=teacher_subject_sections, teacher_lecture_limits=teacher_lecture_limits, teacher_availability=teacher_availability):
                    timetable[section][elective_day][elective_slots[0]] = {"subject": "Elective", "teacher": "respective teacher"}
                    timetable[section][elective_day][elective_slots[1]] = {"subject": "Elective", "teacher": "respective teacher"}

    teacher_lecture_count = {t: 0 for t in data["teachers"]}
    
    for section in data["sections"]:
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
                                and (teacher_lecture_count.get(t, 0) + 2) <= (teacher_lecture_limits.get(t, float('inf')))
                            ]
                            
                            if valid_teachers:
                                teacher = random.choice(valid_teachers)
                                if check_slot_conflict(timetable, section, day, time_slot, teacher, lab_subject, is_two_hour=True, teacher_subject_sections=teacher_subject_sections, teacher_lecture_limits=teacher_lecture_limits, teacher_availability=teacher_availability):
                                    timetable[section][day][time_slot] = {"subject": lab_subject, "teacher": teacher}
                                    timetable[section][day][next_slot] = {"subject": lab_subject, "teacher": teacher}
                                    occurrences_scheduled += 1
                                    lab_occurrences[lab_subject] += 1
                                    teacher_lecture_count[teacher] += 2
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
                        and (teacher_lecture_count.get(t, 0) + 1) <= (teacher_lecture_limits.get(t, float('inf')))
                    ]
                    
                    if valid_teachers:
                        teacher = random.choice(valid_teachers)
                        if check_slot_conflict(timetable, section, day, time_slot, teacher, subject, is_two_hour=False, teacher_subject_sections=teacher_subject_sections, teacher_lecture_limits=teacher_lecture_limits, teacher_availability=teacher_availability):
                            timetable[section][day][time_slot] = {"subject": subject, "teacher": teacher}
                            teacher_lecture_count[teacher] += 1
                            if teacher not in teacher_sections_taught:
                                teacher_sections_taught[teacher] = []
                            if section not in teacher_sections_taught[teacher]:
                                teacher_sections_taught[teacher].append(section)
        
        total_morning_slots = sum(1 for day in days for ts in morning_slots 
                                if ts in timetable[section][day] and timetable[section][day][ts]["subject"] != "Lunch")
        
        needs_afternoon = total_morning_slots < 20
        
        if needs_afternoon:
            for day in days:
                timetable[section][day][lunch_slot] = {"subject": "Lunch", "teacher": None}
            
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
                            and (teacher_lecture_count.get(t, 0) + 1) <= (teacher_lecture_limits.get(t, float('inf')))
                        ]
                        
                        if valid_teachers:
                            teacher = random.choice(valid_teachers)
                            if check_slot_conflict(timetable, section, day, time_slot, teacher, subject, is_two_hour=False, teacher_subject_sections=teacher_subject_sections, teacher_lecture_limits=teacher_lecture_limits, teacher_availability=teacher_availability):
                                timetable[section][day][time_slot] = {"subject": subject, "teacher": teacher}
                                teacher_lecture_count[teacher] += 1
                                if teacher not in teacher_sections_taught:
                                    teacher_sections_taught[teacher] = []
                                if section not in teacher_sections_taught[teacher]:
                                    teacher_sections_taught[teacher].append(section)

    for teacher, limit in teacher_lecture_limits.items():
        if not teacher_availability.get(teacher, True):
            continue
        
        if limit is not None and limit > 0: 
            current_lectures = teacher_lecture_count.get(teacher, 0)
            if current_lectures != limit:
                if current_lectures < limit:
                    for section in data["sections"]:
                        for day in days:
                            for time_slot in data["time_slots"]:
                                if time_slot == lunch_slot or (day in elective_days and time_slot in elective_slots):
                                    continue
                                if timetable[section][day].get(time_slot, {}).get("teacher") is None:
                                    subject = random.choice(core_subjects_all + lab_subjects + (exclusive_subjects.get(section, [])))
                                    if teacher in subject_teacher_mapping[subject] and teacher in teacher_subject_sections and subject in teacher_subject_sections[teacher] and section in teacher_subject_sections[teacher][subject]:
                                        if check_slot_conflict(timetable, section, day, time_slot, teacher, subject, is_two_hour=False, teacher_subject_sections=teacher_subject_sections, teacher_lecture_limits=teacher_lecture_limits, teacher_availability=teacher_availability):
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
