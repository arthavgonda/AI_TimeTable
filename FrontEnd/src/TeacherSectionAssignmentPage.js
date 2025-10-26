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
  TextField,
  InputAdornment,
  LinearProgress,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import { styled } from "@mui/system";
import { 
  Refresh, 
  School, 
  Assignment, 
  Search, 
  CheckCircle,
  RadioButtonUnchecked,
  Warning,
  Person,
  Add,
  Info,
} from "@mui/icons-material";
import { useQuery } from "@tanstack/react-query";

const API_URL = "http://localhost:8000";

const StyledContainer = styled(Container)(({ theme }) => ({
  padding: theme.spacing(3),
  minHeight: "100vh",
}));

const Header = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  marginBottom: theme.spacing(3),
  background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
  borderLeft: "4px solid #3b82f6",
  borderBottom: "1px solid #e2e8f0",
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

const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: "12px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  border: "1px solid #e2e8f0",
  transition: "all 0.2s ease-in-out",
  "&:hover": {
    boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
  },
}));

const StatusIndicator = styled(Box)(({ status }) => ({
  width: "40px",
  height: "40px",
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 700,
  fontSize: "14px",
  backgroundColor: 
    status === "complete" ? "#d1fae5" :
    status === "partial" ? "#fef3c7" :
    "#f3f4f6",
  color:
    status === "complete" ? "#065f46" :
    status === "partial" ? "#92400e" :
    "#64748b",
}));

function TeacherAssignmentPage() {
  const [teachers, setTeachers] = useState([]);
  const [filteredTeachers, setFilteredTeachers] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [course, setCourse] = useState("BTech");
  const [semester, setSemester] = useState(4);
  const [courses, setCourses] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [openAssignDialog, setOpenAssignDialog] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);


  const calculateMetrics = () => {

    const eligibleTeachers = teachers.filter(t => t.eligibleSubjects.length > 0);
    const totalTeachers = eligibleTeachers.length;
    const totalSubjects = subjects.length;
    const assignedCount = eligibleTeachers.filter(t => 
      Object.keys(t.subjectSections).length > 0
    ).length;
    const completeCount = eligibleTeachers.filter(t => {
      const assignedSubjects = Object.keys(t.subjectSections).length;
      return assignedSubjects === t.eligibleSubjects.length && t.eligibleSubjects.length > 0;
    }).length;
    const emptyCount = eligibleTeachers.filter(t => 
      Object.keys(t.subjectSections).length === 0 && t.eligibleSubjects.length > 0
    ).length;
    const totalAssignments = eligibleTeachers.reduce((sum, t) => 
      sum + Object.keys(t.subjectSections).length, 0
    );
    const avgPerTeacher = totalTeachers > 0 ? (totalAssignments / totalTeachers).toFixed(1) : 0;

    return {
      totalTeachers,
      totalSubjects,
      assignedCount,
      completeCount,
      emptyCount,
      totalAssignments,
      avgPerTeacher,
    };
  };


  const getTeacherStatus = (teacher) => {
    const assignedCount = Object.keys(teacher.subjectSections).length;
    const eligibleCount = teacher.eligibleSubjects.length;
    
    if (eligibleCount === 0) return { status: "none", percent: 0, label: "Not Eligible" };
    if (assignedCount === 0) return { status: "none", percent: 0, label: "Unassigned" };
    if (assignedCount === eligibleCount) return { status: "complete", percent: 100, label: "Complete" };
    return { status: "partial", percent: Math.round((assignedCount / eligibleCount) * 100), label: `${assignedCount}/${eligibleCount}` };
  };


  useEffect(() => {

    const eligibleTeachers = teachers.filter(t => t.eligibleSubjects.length > 0);
    

    if (!searchQuery.trim()) {
      setFilteredTeachers(eligibleTeachers);
    } else {
      const query = searchQuery.toLowerCase().trim();
      const filtered = eligibleTeachers.filter(t => 
        t.name.toLowerCase().includes(query)
      );
      setFilteredTeachers(filtered);
    }
  }, [searchQuery, teachers]);


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
      setFilteredTeachers(teacherList);
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
    

    const isUnassigning = selectedSections.length === 0;
    setMessage(isUnassigning ? "Removing assignment..." : "Assigning subject and sections...");
    
    try {

      setTeachers((prev) =>
        prev.map((teacher) => {
          if (teacher.name === teacherName) {
            const newSubjectSections = { ...teacher.subjectSections };
            

            if (isUnassigning) {
              delete newSubjectSections[subject];
            } else {
              newSubjectSections[subject] = selectedSections;
            }
            
            return {
              ...teacher,
              subjectSections: newSubjectSections,
            };
          }
          return teacher;
        })
      );


      if (isUnassigning) {

        await axios.post(`${API_URL}/assign_teacher_subject_sections`, {
          teacher_id: teacherName,
          subject: subject,
          sections: [],
        });
        setMessage(`✅ Removed assignment of ${subject} from ${teacherName}`);
      } else {

        await axios.post(`${API_URL}/assign_teacher_subject_sections`, {
          teacher_id: teacherName,
          subject: subject,
          sections: selectedSections,
        });
        setMessage(`✅ Assigned ${subject} to ${teacherName} for sections: ${selectedSections.join(", ")}`);
      }
      

      await axios.post(`${API_URL}/sync_teachers`);
      

      await fetchTeacherData();
    } catch (error) {
      setMessage("Error: " + (error.response?.data?.detail || error.message));
      console.error("Assignment error:", error);

      await fetchTeacherData();
    } finally {
      setLoading(false);
    }
  };

  return (
    <StyledContainer maxWidth="xl">
      {/* Improved Header */}
      <Header elevation={0}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Assignment sx={{ fontSize: 36, color: "#3b82f6" }} />
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: "#1e293b", mb: 0.5 }}>
                Assign Subjects & Sections
              </Typography>
              <Typography variant="body1" sx={{ color: "#64748b" }}>
                Map teachers to subjects and sections for automated timetable generation
              </Typography>
            </Box>
          </Box>
          <Info sx={{ color: "#64748b", fontSize: 28 }} />
        </Box>
        <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
          <Chip 
            icon={<Person />}
            label={`${teachers.filter(t => t.eligibleSubjects.length > 0).length} Eligible Teachers`}
            sx={{ backgroundColor: "#e0e7ff", color: "#4f46e5", fontWeight: 600 }}
          />
          <Chip 
            icon={<School />}
            label={`${subjects.length} Subjects`}
            sx={{ backgroundColor: "#dbeafe", color: "#1e40af", fontWeight: 600 }}
          />
          <Chip 
            icon={<Info />}
            label={`${sections.length} Sections`}
            sx={{ backgroundColor: "#d1fae5", color: "#065f46", fontWeight: 600 }}
          />
        </Box>
      </Header>

      {/* Summary Metrics Cards */}
      {(() => {
        const metrics = calculateMetrics();
        return (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={2.4}>
              <StyledCard>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                    <Person sx={{ color: "#3b82f6" }} />
                    <Typography variant="caption" sx={{ fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>
                      Total Teachers
                    </Typography>
                  </Box>
                  <Typography variant="h3" sx={{ fontWeight: 700, color: "#1e293b" }}>
                    {metrics.totalTeachers}
                  </Typography>
                </CardContent>
              </StyledCard>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <StyledCard>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                    <CheckCircle sx={{ color: "#10b981" }} />
                    <Typography variant="caption" sx={{ fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>
                      Complete
                    </Typography>
                  </Box>
                  <Typography variant="h3" sx={{ fontWeight: 700, color: "#10b981" }}>
                    {metrics.completeCount}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#64748b" }}>
                    {metrics.totalTeachers > 0 ? `${Math.round((metrics.completeCount / metrics.totalTeachers) * 100)}%` : "0%"}
                  </Typography>
                </CardContent>
              </StyledCard>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <StyledCard>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                    <Warning sx={{ color: "#f59e0b" }} />
                    <Typography variant="caption" sx={{ fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>
                      Partial
                    </Typography>
                  </Box>
                  <Typography variant="h3" sx={{ fontWeight: 700, color: "#f59e0b" }}>
                    {metrics.assignedCount - metrics.completeCount}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#64748b" }}>
                    Some assigned
                  </Typography>
                </CardContent>
              </StyledCard>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <StyledCard>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                    <RadioButtonUnchecked sx={{ color: "#9ca3af" }} />
                    <Typography variant="caption" sx={{ fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>
                      Unassigned
                    </Typography>
                  </Box>
                  <Typography variant="h3" sx={{ fontWeight: 700, color: "#9ca3af" }}>
                    {metrics.emptyCount}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#64748b" }}>
                    {metrics.totalTeachers > 0 ? `${Math.round((metrics.emptyCount / metrics.totalTeachers) * 100)}%` : "0%"}
                  </Typography>
                </CardContent>
              </StyledCard>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <StyledCard>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                    <Assignment sx={{ color: "#8b5cf6" }} />
                    <Typography variant="caption" sx={{ fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>
                      Avg/Teacher
                    </Typography>
                  </Box>
                  <Typography variant="h3" sx={{ fontWeight: 700, color: "#8b5cf6" }}>
                    {metrics.avgPerTeacher}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#64748b" }}>
                    assignments
                  </Typography>
                </CardContent>
              </StyledCard>
            </Grid>
          </Grid>
        );
      })()}

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

      {/* Search Bar */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search teachers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: "10px",
              backgroundColor: "#ffffff",
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: "#64748b" }} />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Teacher Assignment Table */}
      <StyledPaper>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, color: "#1e293b" }}>
            Teacher Subject Assignments
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748b" }}>
            Showing {filteredTeachers.length} of {teachers.length}
          </Typography>
        </Box>

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
                <TableCell sx={{ fontWeight: 700, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px", width: "250px" }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Teacher</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Subject & Section Assignments</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px", width: "100px" }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTeachers.map((teacher) => {
                const teacherStatus = getTeacherStatus(teacher);
                return (
                  <TableRow key={teacher.id}>
                  <TableCell sx={{ verticalAlign: "top" }}>
                    <StatusIndicator status={teacherStatus.status}>
                      {teacherStatus.percent}%
                    </StatusIndicator>
                    <Typography variant="caption" sx={{ display: "block", textAlign: "center", mt: 0.5, color: "#64748b", fontWeight: 600 }}>
                      {teacherStatus.label}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ verticalAlign: "top" }}>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: "#1e293b", mb: 0.5 }}>
                      {teacher.name}
                    </Typography>
                    {teacher.eligibleSubjects.length > 0 && (
                      <Typography variant="caption" sx={{ color: "#64748b" }}>
                        {teacher.eligibleSubjects.length} eligible subjects
                      </Typography>
                    )}
                    {teacher.eligibleSubjects.length === 0 && (
                      <Typography variant="caption" sx={{ color: "#ef4444" }}>
                        ⚠️ No eligible subjects for {course} Sem {semester}
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
                      <Box sx={{ p: 2, textAlign: "center", border: "2px dashed #e2e8f0", borderRadius: "8px", backgroundColor: "#f8fafc" }}>
                        <Typography variant="body2" sx={{ color: "#64748b", mb: 1 }}>
                          No eligible subjects for {course} Semester {semester}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                          Add subjects to this teacher's profile in Teacher Management
                        </Typography>
                      </Box>
                    )}
                  </TableCell>
                  <TableCell>
                    {teacher.eligibleSubjects.length > 0 && (
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Add />}
                        onClick={() => {
                          setSelectedTeacher(teacher);
                          setOpenAssignDialog(true);
                        }}
                        disabled={loading}
                      >
                        Assign
                      </Button>
                    )}
                  </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </StyledTable>
        )}
      </StyledPaper>
    </StyledContainer>
  );
}

export default TeacherAssignmentPage;
