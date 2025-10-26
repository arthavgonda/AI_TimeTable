courses = {
    "BTech": {
        "semesters": [1, 2, 3, 4, 5, 6, 7, 8],
        "sections": ["A", "B", "C", "D", "E", "F", "G", "H", "ARQ", "DS1", "DS2", "ML1", "ML2", "Cyber", "AI"]
    },
    "MCA": {
        "semesters": [1, 2, 3, 4],
        "sections": ["A", "B"]
    },
    "MBA": {
        "semesters": [1, 2, 3, 4],
        "sections": ["A", "B"]
    },
    "BCA": {
        "semesters": [1, 2, 3, 4, 5, 6],
        "sections": ["A", "B", "C"]
    }
}

SUBJECTS_BY_SEMESTER = {
    "BTech": {
        1: ["TCS-101", "TCS-102", "PCS-101", "PCS-102"],
        2: ["TCS-201", "TCS-202", "PCS-201", "PCS-202"],
        3: ["TCS-301", "TCS-302", "TCS-303", "PCS-301", "PCS-302"],
        4: ["TCS-408", "TCS-402", "TCS-403", "TCS-409", "XCS-401", "TOC-401", "PCS-408", "PCS-403", "PCS-409", "DP900", "AI900", "NDE", "Elective"],
        5: ["TCS-501", "TCS-502", "TCS-503", "PCS-501", "PCS-502"],
        6: ["TCS-601", "TCS-602", "TCS-603", "PCS-601", "PCS-602"],
        7: ["TCS-701", "TCS-702", "PCS-701", "Elective"],
        8: ["TCS-801", "TCS-802", "Project"]
    },
    "MCA": {
        1: ["MCS-101", "MCS-102", "MCS-103"],
        2: ["MCS-201", "MCS-202", "MCS-203"],
        3: ["MCS-301", "MCS-302", "MCS-303"],
        4: ["MCS-401", "Project"]
    },
    "MBA": {
        1: ["MBS-101", "MBS-102", "MBS-103"],
        2: ["MBS-201", "MBS-202", "MBS-203"],
        3: ["MBS-301", "MBS-302", "MBS-303"],
        4: ["MBS-401", "Project"]
    },
    "BCA": {
        1: ["BCS-101", "BCS-102", "BCS-103"],
        2: ["BCS-201", "BCS-202", "BCS-203"],
        3: ["BCS-301", "BCS-302", "BCS-303"],
        4: ["BCS-401", "BCS-402", "BCS-403"],
        5: ["BCS-501", "BCS-502", "BCS-503"],
        6: ["BCS-601", "Project"]
    }
}


DEFAULT_TEACHERS = [
    "Dr. D.R. Gangodkar", "Dr. Jyoti Agarwal", "Dr. Amit Kumar", "Mr. Kireet Joshi",
    "Mr. Sanjeev Kukreti", "Ms. Garima Sharma", "Mr. Chitransh", "Dr. Vikas Tripathi",
    "Mr. Piyush Agarwal", "Mr. Vivek Tomer", "Mr. Rishi Kumar", "Dr. S.P. Mourya",
    "Dr. Ankit Tomer", "Dr. Hemant Singh Pokhariya", "Dr. Sribidhya Mohanty",
    "Dr. Abhay Sharma", "Dr. Gourav Verma", "Dr. Mridul Gupta", "Dr. Vikas Rathi",
    "Mr. Akshay Rajput", "Dr. Anupam Singh", "Ms. Meenakshi Maindola",
    "Mr. Siddhant Thapliyal", "Mr. Abhinav Sharma", "Ms. Shweta Bajaj",
    "Ms. Priyanka Agarwal", "Ms. Medhavi Vishnoi", "Mr. Rana Pratap Mishra",
    "Mr. Shobhit Garg", "Mr. Vishal Trivedi", "Dr. Teekam Singh",
    "Mr. Mohammad Rehan", "Mr. O.P. Pal", "Dr. Jay R. Bhatnagar", "Dr. Deepak Gaur",
    "Mr. Gulshan", "Dr. Pawan Kumar Mishra", "Dr. Pradeep Juneja", "Mr. Kamlesh Kukreti",
    "Ms. Poonam Raturi", "Ms. Neha Belwal", "Ms. Alankrita Joshi", "Dr. Upma Jain",
    "Mr. Jagdish Chandola", "Dr. Hradesh Kumar", "Mr. Sharath K R", "Mr. Rohan Verma",
    "Mr. Kuldeep Nautiyal"
]

data = {
    "sections": ["A", "B", "C", "D", "E", "F", "G", "H", "ARQ", "DS1", "DS2", "ML1", "ML2", "Cyber", "AI"],
    "subjects": [
        "TCS-408", "TCS-402", "TCS-403", "TCS-409", "XCS-401", "TOC-401",
        "Elective", "PCS-408", "PCS-403", "PCS-409", "DP900", "AI900", "NDE"
    ],
    "teachers": DEFAULT_TEACHERS.copy(),  
    "days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    "time_slots": [
        "8:00-9:00", "9:00-10:00", "10:00-11:00", "11:00-12:00",
        "12:00-13:00", "13:00-14:00", "14:00-15:00", "15:00-16:00"
    ]
}

def load_teachers_from_db(db):
    """Load all active teachers from database and update data['teachers']"""
    try:
        from backend_api import Teacher
        teachers = db.query(Teacher).filter(Teacher.is_active == True).all()
        if teachers:
            data["teachers"] = [teacher.name for teacher in teachers]
            print(f"Loaded {len(data['teachers'])} teachers from database")
        else:
            print("No teachers found in database, using defaults")
    except Exception as e:
        print(f"Error loading teachers from database: {e}")
        data["teachers"] = DEFAULT_TEACHERS.copy()

def get_all_teachers():
    """Get list of all active teachers"""
    return data["teachers"]

def sync_teacher_to_data(teacher_name):
    """Add a teacher to the data structure if not already present"""
    if teacher_name not in data["teachers"]:
        data["teachers"].append(teacher_name)
        print(f"Added teacher {teacher_name} to data structure")

def remove_teacher_from_data(teacher_name):
    """Remove a teacher from the data structure"""
    if teacher_name in data["teachers"]:
        data["teachers"].remove(teacher_name)
        print(f"Removed teacher {teacher_name} from data structure")

subject_teacher_mapping = {
    "TCS-408": ["Dr. D.R. Gangodkar", "Dr. Jyoti Agarwal", "Dr. Amit Kumar", "Mr. Kireet Joshi", "Mr. Sanjeev Kukreti", "Ms. Garima Sharma", "Mr. Chitransh"],
    "TCS-402": ["Dr. Vikas Tripathi", "Mr. Piyush Agarwal", "Mr. Vivek Tomer", "Mr. Rishi Kumar", "Dr. S.P. Mourya", "Dr. Ankit Tomer"],
    "TCS-403": ["Dr. Hemant Singh Pokhariya", "Dr. Sribidhya Mohanty", "Dr. Abhay Sharma", "Dr. Gourav Verma", "Dr. Mridul Gupta", "Dr. Vikas Rathi"],
    "TCS-409": ["Mr. Akshay Rajput", "Dr. Anupam Singh", "Ms. Meenakshi Maindola", "Mr. Siddhant Thapliyal"],
    "XCS-401": ["Mr. Abhinav Sharma", "Ms. Shweta Bajaj", "Ms. Priyanka Agarwal", "Ms. Medhavi Vishnoi", "Mr. Rana Pratap Mishra", "Mr. Shobhit Garg"],
    "TOC-401": ["Mr. Akshay Rajput", "Mr. Siddhant Thapliyal", "Ms. Meenakshi Maindola"],
    "Elective": [
        "Mr. Vishal Trivedi", "Dr. Teekam Singh", "Mr. Mohammad Rehan", "Mr. O.P. Pal",
        "Dr. Jay R. Bhatnagar", "Ms. Garima Sharma", "Mr. Siddhant Thapliyal",
        "Dr. S.P. Mourya", "Dr. Deepak Gaur"
    ],
    "PCS-408": ["Mr. Kireet Joshi", "Mr. Gulshan", "Dr. Pawan Kumar Mishra", "Mr. Sanjeev Kukreti", "Dr. Jyoti Agarwal", "Mr. Mohammad Rehan", "Mr. Chitransh"],
    "PCS-403": ["Dr. Hemant Singh Pokhariya", "Dr. Sribidhya Mohanty", "Dr. Pradeep Juneja", "Mr. Kamlesh Kukreti", "Ms. Poonam Raturi", "Dr. Mridul Gupta", "Ms. Neha Belwal", "Ms. Alankrita Joshi"],
    "PCS-409": ["Dr. Upma Jain", "Mr. Jagdish Chandola", "Dr. Hradesh Kumar", "Mr. Sharath K R", "Mr. Rohan Verma", "Mr. Kuldeep Nautiyal"],
    "DP900": ["Mr. Vishal Trivedi", "Dr. Teekam Singh"],
    "AI900": ["Dr. Jay R. Bhatnagar", "Ms. Garima Sharma"],
    "NDE": ["Mr. Mohammad Rehan", "Mr. O.P. Pal"],
    
    "MCS-101": ["Dr. Amit Kumar", "Dr. Vikas Tripathi"],
    "MCS-102": ["Dr. Jyoti Agarwal", "Mr. Piyush Agarwal"],
    "MCS-103": ["Dr. Hemant Singh Pokhariya", "Dr. Sribidhya Mohanty"],
    "MBS-101": ["Dr. Deepak Gaur", "Dr. Jay R. Bhatnagar"],
    "MBS-102": ["Mr. Vishal Trivedi", "Dr. Teekam Singh"],
    "MBS-103": ["Mr. Mohammad Rehan", "Mr. O.P. Pal"],
    "BCS-101": ["Dr. D.R. Gangodkar", "Dr. Jyoti Agarwal"],
    "BCS-102": ["Dr. Amit Kumar", "Mr. Kireet Joshi"],
    "BCS-103": ["Mr. Sanjeev Kukreti", "Ms. Garima Sharma"],
    "Project": ["Dr. D.R. Gangodkar", "Dr. Jyoti Agarwal", "Dr. Amit Kumar"]
}

teacher_course_mapping = {}

def get_semester_from_subject_code(subject_code):
    """Extract semester number from subject code"""
    try:
        if "-" in subject_code:
            number_part = subject_code.split("-")[1]
            if number_part.isdigit():
                return int(number_part[0])
            
            if len(number_part) >= 3 and number_part[:1].isdigit():
                return int(number_part[0])
    except:
        pass
    return None

def get_subjects_for_semester(course, semester):
    """Get subjects for a given course and semester"""
    try:
        if course in SUBJECTS_BY_SEMESTER:
            if semester in SUBJECTS_BY_SEMESTER[course]:
                return SUBJECTS_BY_SEMESTER[course][semester]
    except Exception as e:
        print(f"Error getting subjects for {course} semester {semester}: {e}")
    return []

def get_sections_for_course(course):
    """Get all sections for a given course"""
    if course in courses:
        return courses[course]["sections"]
    return []

def get_semesters_for_course(course):
    """Get all semesters for a given course"""
    if course in courses:
        return courses[course]["semesters"]
    return []

def validate_course_semester_section(course, semester, section):
    """Validate if the combination of course, semester, and section is valid"""
    if course not in courses:
        return False, f"Course '{course}' not found"
    
    if semester not in courses[course]["semesters"]:
        return False, f"Semester {semester} not available for {course}"
    
    if section not in courses[course]["sections"]:
        return False, f"Section '{section}' not available for {course}"
    
    return True, "Valid combination"

def get_teachers_for_subject(subject):
    """Get list of teachers who can teach a subject"""
    return subject_teacher_mapping.get(subject, [])

def get_all_courses():
    """Get list of all available courses"""
    return list(courses.keys())
