import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  Box,
  Alert,
  Chip,
  Stack,
  Divider
} from "@mui/material";
import { styled } from "@mui/system";

const API_URL = "http://localhost:8000";

const StyledContainer = styled(Container)(({ theme }) => ({
  padding: theme.spacing(4),
  backgroundColor: "#f5f7fa",
  minHeight: "100vh",
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: "12px",
  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
  backgroundColor: "#ffffff",
}));

const StyledTable = styled(Table)(({ theme }) => ({
  "& .MuiTableHead-root": {
    backgroundColor: "#e3f2fd",
  },
  "& .MuiTableRow-root:nth-of-type(odd)": {
    backgroundColor: "#f5f5f5",
  },
}));

const SubjectChip = styled(Chip)(({ theme }) => ({
  marginBottom: theme.spacing(1),
  fontWeight: "bold",
  backgroundColor: "#e3f2fd",
}));

function TeacherAssignmentPage() {
  const [teachers, setTeachers] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sections, setSections] = useState([]);

  useEffect(() => {
    fetchTeacherData();
  }, []);

  const fetchTeacherData = async () => {
    setLoading(true);
    try {
      const [availabilityResponse, subjectSectionsResponse] = await Promise.all([
        axios.get(`${API_URL}/teacher_availability`),
        axios.get(`${API_URL}/teacher_subject_sections`),
      ]);
      const availability = availabilityResponse.data;
      const teacherSubjectSections = subjectSectionsResponse.data || {};

      const teacherList = Object.keys(availability).map((teacher) => {
        const eligibleSubjects = Object.keys(subject_teacher_mapping).filter(
          subject => subject_teacher_mapping[subject].includes(teacher)
        );

        return {
          name: teacher,
          available: availability[teacher],
          eligibleSubjects: eligibleSubjects,
          subjectSections: teacherSubjectSections[teacher] || {},
        };
      });

      setTeachers(teacherList);
      setSections([
        "A", "B", "C", "D", "E", "F", "G", "H", "ARQ", "DS1", "DS2", "ML1", "ML2", "Cyber", "AI",
      ]);
      setMessage("Teacher data loaded successfully!");
    } catch (error) {
      setMessage("Error loading teacher data: " + (error.response?.data?.error || error.message));
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const assignSubjectSectionsToTeacher = async (teacherId, subject, sections) => {
    setLoading(true);
    setMessage("Assigning subject and sections...");
    try {
      setTeachers((prev) =>
        prev.map((teacher) =>
          teacher.name === teacherId
            ? {
                ...teacher,
                subjectSections: {
                  ...teacher.subjectSections,
                  [subject]: sections,
                },
              }
            : teacher
        )
      );

      await axios.post(`${API_URL}/assign_teacher_subject_sections`, {
        teacher_id: teacherId,
        subject: subject,
        sections: sections,
      });
      setMessage("Subject and sections assigned successfully and persisted!");
    } catch (error) {
      setMessage("Error assigning subject and sections: " + (error.response?.data?.detail || error.message));
      console.error("Assignment error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <StyledContainer>
      <StyledPaper>
        <Typography
          variant="h4"
          gutterBottom
          sx={{ fontWeight: "bold", color: "#1e88e5", marginBottom: 4, textAlign: "center" }}
        >
          Assign Subjects and Sections to Teachers
        </Typography>

        {message && (
          <Alert
            severity={message.includes("Error") ? "error" : "success"}
            sx={{ marginBottom: 2, borderRadius: "8px" }}
          >
            {message}
          </Alert>
        )}

        <StyledTable>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: "bold", color: "#2196f3", padding: 2 }}>Teacher</TableCell>
              <TableCell sx={{ fontWeight: "bold", color: "#2196f3", padding: 2 }}>Subject Assignments</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {teachers.map((teacher) => (
              <TableRow key={teacher.name} sx={{ padding: 1 }}>
                <TableCell sx={{ padding: 2, fontWeight: "500" }}>
                  {teacher.name}
                  {!teacher.available && (
                    <Chip 
                      label="Unavailable" 
                      size="small" 
                      color="error" 
                      sx={{ ml: 1 }} 
                    />
                  )}
                </TableCell>
                <TableCell sx={{ padding: 2 }}>
                  {teacher.eligibleSubjects.length > 0 ? (
                    <Stack spacing={2} divider={<Divider flexItem />}>
                      {teacher.eligibleSubjects.map((subject) => (
                        <Box key={`${teacher.name}-${subject}`}>
                          <SubjectChip label={subject} />
                          <FormControl fullWidth sx={{ mt: 1 }}>
                            <InputLabel>Sections</InputLabel>
                            <Select
                              multiple
                              value={teacher.subjectSections[subject] || []}
                              onChange={(e) => assignSubjectSectionsToTeacher(teacher.name, subject, e.target.value)}
                              label="Sections"
                              disabled={loading || !teacher.available}
                              MenuProps={{ PaperProps: { style: { maxHeight: 200 } } }}
                              renderValue={(selected) => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                  {selected.map((value) => (
                                    <Chip key={value} label={value} size="small" />
                                  ))}
                                </Box>
                              )}
                            >
                              {sections.map((section) => (
                                <MenuItem key={section} value={section}>
                                  {section}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Box>
                      ))}
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No eligible subjects assigned.
                    </Typography>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </StyledTable>
      </StyledPaper>
    </StyledContainer>
  );
}

const subject_teacher_mapping = {
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
  "NDE": ["Mr. Mohammad Rehan", "Mr. O.P. Pal"]
};

export default TeacherAssignmentPage;
