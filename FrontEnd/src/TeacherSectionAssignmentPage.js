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
  Divider,
  Grid,
  Button,
  CircularProgress,
  Card,
  CardContent,
} from "@mui/material";
import { styled } from "@mui/system";
import { Refresh, School, Assignment } from "@mui/icons-material";

const API_URL = "http:

const StyledContainer = styled(Container)(({ theme }) => ({
  padding: theme.spacing(3),
  minHeight: "100vh",
}));

const Header = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginTop: theme.spacing(2),
}));

const StyledTable = styled(Table)(({ theme }) => ({
  "& .MuiTableHead-root": {
    backgroundColor: "#f5f5f5",
  },
}));

const SubjectChip = styled(Chip)(({ theme }) => ({
  marginBottom: theme.spacing(0.5),
  fontWeight: 500,
}));

function TeacherAssignmentPage() {
  const [teachers, setTeachers] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [course, setCourse] = useState("BTech");
  const [semester, setSemester] = useState(4);
  const [courses, setCourses] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);

  
  useEffect(() => {
    const loadCourses = async () => {
      try {
        const response = await axios.get(`${API_URL}/courses`);
        setCourses(response.data.courses || []);
      } catch (error) {
        console.error("Error loading courses:", error);
      }
    };
    loadCourses();
  }, []);

  
  useEffect(() => {
    if (course) {
      const loadSemesters = async () => {
        try {
          const response = await axios.get(`${API_URL}/semesters/${course}`);
          setSemesters(response.data.semesters || []);
        } catch (error) {
          console.error("Error loading semesters:", error);
        }
      };
      loadSemesters();
    }
  }, [course]);

  
  useEffect(() => {
    if (course) {
      const loadSections = async () => {
        try {
          const response = await axios.get(`${API_URL}/sections/${course}`);
          setSections(response.data.sections || []);
        } catch (error) {
          console.error("Error loading sections:", error);
        }
      };
      loadSections();
    }
  }, [course]);

  
  useEffect(() => {
    if (course && semester) {
      const loadSubjects = async () => {
        try {
          const response = await axios.get(`${API_URL}/subjects/${course}/${semester}`);
          setSubjects(response.data.subjects || []);
        } catch (error) {
          console.error("Error loading subjects:", error);
        }
      };
      loadSubjects();
    }
  }, [course, semester]);

  
  useEffect(() => {
    if (course && semester) {
      fetchTeacherData();
      
      
      const intervalId = setInterval(() => {
        fetchTeacherData();
      }, 10000);
      
      return () => clearInterval(intervalId);
    }
  }, [course, semester]);

  const fetchTeacherData = async () => {
    setLoading(true);
    try {
      const [teachersResponse, subjectSectionsResponse] = await Promise.all([
        axios.get(`${API_URL}/teachers`),
        axios.get(`${API_URL}/teacher_subject_sections`),
      ]);
      
      const teachersList = teachersResponse.data.teachers || [];
      const teacherSubjectSections = subjectSectionsResponse.data || {};

      const teacherList = teachersList.map((teacher) => {
        
        const eligibleSubjects = [];
        if (teacher.courseSubjects && teacher.courseSubjects[course]) {
          const semKey = semester.toString();
          if (teacher.courseSubjects[course][semKey]) {
            eligibleSubjects.push(...teacher.courseSubjects[course][semKey]);
          }
        }

        return {
          id: teacher.id,
          name: teacher.name,
          eligibleSubjects: eligibleSubjects.filter(s => subjects.includes(s)),
          subjectSections: teacherSubjectSections[teacher.name] || {},
        };
      });

      setTeachers(teacherList);
      setMessage(`Loaded ${teacherList.length} teachers for ${course} Semester ${semester}`);
    } catch (error) {
      setMessage("Error loading teacher data: " + (error.response?.data?.error || error.message));
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const assignSubjectSectionsToTeacher = async (teacherId, teacherName, subject, selectedSections) => {
    setLoading(true);
    setMessage("Assigning subject and sections...");
    try {
      
      setTeachers((prev) =>
        prev.map((teacher) =>
          teacher.name === teacherName
            ? {
                ...teacher,
                subjectSections: {
                  ...teacher.subjectSections,
                  [subject]: selectedSections,
                },
              }
            : teacher
        )
      );

      
      await axios.post(`${API_URL}/assign_teacher_subject_sections`, {
        teacher_id: teacherName,
        subject: subject,
        sections: selectedSections,
      });
      
      
      await axios.post(`${API_URL}/sync_teachers`);
      
      setMessage(`✅ Assigned ${subject} to ${teacherName} for sections: ${selectedSections.join(", ")}`);
    } catch (error) {
      setMessage("Error assigning: " + (error.response?.data?.detail || error.message));
      console.error("Assignment error:", error);
      
      fetchTeacherData();
    } finally {
      setLoading(false);
    }
  };

  return (
    <StyledContainer maxWidth="xl">
      {/* Header */}
      <Header elevation={1}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Assignment sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Assign Subjects & Sections
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Assign teachers to subjects and sections for timetable generation
            </Typography>
          </Box>
        </Box>
      </Header>

      {/* Course/Semester Selection */}
      <Card>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Course</InputLabel>
                <Select
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  label="Course"
                >
                  {courses.map((c) => (
                    <MenuItem key={c} value={c}>{c}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Semester</InputLabel>
                <Select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  label="Semester"
                >
                  {semesters.map((sem) => (
                    <MenuItem key={sem} value={sem}>Semester {sem}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Chip 
                icon={<School />}
                label={`${subjects.length} Subjects`} 
                color="primary" 
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<Refresh />}
                onClick={fetchTeacherData}
                disabled={loading}
              >
                Refresh
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {message && (
        <Alert
          severity={message.includes("Error") ? "error" : "success"}
          sx={{ mt: 2 }}
          onClose={() => setMessage("")}
        >
          {message}
        </Alert>
      )}

      {/* Teacher Assignment Table */}
      <StyledPaper>
        <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
          Teacher Subject Assignments - {course} Semester {semester}
        </Typography>

        {loading && !teachers.length ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress />
          </Box>
        ) : teachers.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ p: 4, textAlign: "center" }}>
            No teachers found. Add teachers in Teacher Management.
          </Typography>
        ) : (
          <StyledTable>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, width: "30%" }}>Teacher</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Subject & Section Assignments</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {teachers.map((teacher) => (
                <TableRow key={teacher.id}>
                  <TableCell sx={{ verticalAlign: "top" }}>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {teacher.name}
                    </Typography>
                    {teacher.eligibleSubjects.length > 0 && (
                      <Typography variant="caption" color="text.secondary">
                        {teacher.eligibleSubjects.length} subjects available
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {teacher.eligibleSubjects.length > 0 ? (
                      <Stack spacing={2} divider={<Divider flexItem />}>
                        {teacher.eligibleSubjects.map((subject) => (
                          <Box key={`${teacher.name}-${subject}`}>
                            <SubjectChip 
                              label={subject} 
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                            <FormControl fullWidth sx={{ mt: 1 }}>
                              <InputLabel>Assign Sections</InputLabel>
                              <Select
                                multiple
                                value={teacher.subjectSections[subject] || []}
                                onChange={(e) => assignSubjectSectionsToTeacher(
                                  teacher.id,
                                  teacher.name,
                                  subject,
                                  e.target.value
                                )}
                                label="Assign Sections"
                                disabled={loading}
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
                                    Section {section}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Box>
                        ))}
                      </Stack>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No subjects assigned for {course} Semester {semester}.
                        <br />
                        Add subjects in Teacher Management.
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </StyledTable>
        )}
      </StyledPaper>
    </StyledContainer>
  );
}

export default TeacherAssignmentPage;
