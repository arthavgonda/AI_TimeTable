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
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Box,
  Paper,
  Alert,
  IconButton,
  Checkbox,
  FormControlLabel,
  Grid,
  Card,
  CardContent,
} from "@mui/material";
import { styled } from "@mui/system";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:8000";

const COURSES = ["BTech", "MCA", "MBA", "BCA"];
const SEMESTERS = {
  "BTech": [1, 2, 3, 4, 5, 6, 7, 8],
  "MCA": [1, 2, 3, 4],
  "MBA": [1, 2, 3, 4],
  "BCA": [1, 2, 3, 4, 5, 6]
};

const SUBJECTS_BY_SEMESTER = {
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
};

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
  marginBottom: theme.spacing(3),
}));

const StyledButton = styled(Button)(({ theme }) => ({
  margin: theme.spacing(1),
  borderRadius: "8px",
  textTransform: "none",
  fontWeight: "bold",
}));

const StyledTable = styled(Table)(({ theme }) => ({
  "& .MuiTableHead-root": {
    backgroundColor: "#e3f2fd",
  },
  "& .MuiTableRow-root:nth-of-type(odd)": {
    backgroundColor: "#f5f5f5",
  },
}));

function TeacherManagementPage() {
  const [teachers, setTeachers] = useState([]);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Form states for adding/editing teacher
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    courses: [],
    courseSubjects: {} // { "BTech": { "4": ["TCS-408", "PCS-408"] } }
  });

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/teachers`);
      setTeachers(response.data.teachers || []);
      setMessage("Teachers loaded successfully!");
    } catch (error) {
      setMessage("Error loading teachers: " + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleAddTeacher = async () => {
    setLoading(true);
    try {
      await axios.post(`${API_URL}/add_teacher`, formData);
      setMessage("Teacher added successfully!");
      fetchTeachers();
      setOpenAddDialog(false);
      resetForm();
    } catch (error) {
      setMessage("Error adding teacher: " + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTeacher = async () => {
    setLoading(true);
    try {
      await axios.put(`${API_URL}/update_teacher/${selectedTeacher.id}`, formData);
      setMessage("Teacher updated successfully!");
      fetchTeachers();
      setOpenEditDialog(false);
      resetForm();
    } catch (error) {
      setMessage("Error updating teacher: " + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTeacher = async (teacherId) => {
    if (!window.confirm("Are you sure you want to delete this teacher?")) return;
    
    setLoading(true);
    try {
      await axios.delete(`${API_URL}/delete_teacher/${teacherId}`);
      setMessage("Teacher deleted successfully!");
      fetchTeachers();
    } catch (error) {
      setMessage("Error deleting teacher: " + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      courses: [],
      courseSubjects: {}
    });
    setSelectedTeacher(null);
  };

  const handleCourseChange = (course) => {
    const newCourses = formData.courses.includes(course)
      ? formData.courses.filter(c => c !== course)
      : [...formData.courses, course];
    
    const newCourseSubjects = { ...formData.courseSubjects };
    if (!newCourses.includes(course)) {
      delete newCourseSubjects[course];
    } else if (!newCourseSubjects[course]) {
      newCourseSubjects[course] = {};
    }
    
    setFormData({
      ...formData,
      courses: newCourses,
      courseSubjects: newCourseSubjects
    });
  };

  const handleSubjectChange = (course, semester, subject) => {
    const newCourseSubjects = { ...formData.courseSubjects };
    if (!newCourseSubjects[course]) newCourseSubjects[course] = {};
    if (!newCourseSubjects[course][semester]) newCourseSubjects[course][semester] = [];
    
    const subjects = newCourseSubjects[course][semester];
    if (subjects.includes(subject)) {
      newCourseSubjects[course][semester] = subjects.filter(s => s !== subject);
    } else {
      newCourseSubjects[course][semester] = [...subjects, subject];
    }
    
    setFormData({
      ...formData,
      courseSubjects: newCourseSubjects
    });
  };

  const openEdit = (teacher) => {
    setSelectedTeacher(teacher);
    setFormData({
      name: teacher.name,
      email: teacher.email || "",
      phone: teacher.phone || "",
      courses: teacher.courses || [],
      courseSubjects: teacher.courseSubjects || {}
    });
    setOpenEditDialog(true);
  };

  return (
    <StyledContainer>
      <StyledPaper>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" sx={{ fontWeight: "bold", color: "#1e88e5" }}>
            Teacher Management
          </Typography>
          <Box>
            <StyledButton
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => setOpenAddDialog(true)}
            >
              Add Teacher
            </StyledButton>
            <StyledButton
              variant="outlined"
              onClick={() => navigate("/admin")}
            >
              Back to Admin
            </StyledButton>
          </Box>
        </Box>

        {message && (
          <Alert
            severity={message.includes("Error") ? "error" : "success"}
            sx={{ marginBottom: 2, borderRadius: "8px" }}
            onClose={() => setMessage("")}
          >
            {message}
          </Alert>
        )}

        <StyledTable>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: "bold", color: "#2196f3" }}>Name</TableCell>
              <TableCell sx={{ fontWeight: "bold", color: "#2196f3" }}>Email</TableCell>
              <TableCell sx={{ fontWeight: "bold", color: "#2196f3" }}>Courses</TableCell>
              <TableCell sx={{ fontWeight: "bold", color: "#2196f3" }}>Subjects</TableCell>
              <TableCell sx={{ fontWeight: "bold", color: "#2196f3" }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {teachers.map((teacher) => (
              <TableRow key={teacher.id}>
                <TableCell>{teacher.name}</TableCell>
                <TableCell>{teacher.email || "N/A"}</TableCell>
                <TableCell>
                  <Box display="flex" flexWrap="wrap" gap={0.5}>
                    {(teacher.courses || []).map(course => (
                      <Chip key={course} label={course} size="small" color="primary" />
                    ))}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box display="flex" flexWrap="wrap" gap={0.5}>
                    {Object.entries(teacher.courseSubjects || {}).map(([course, semesters]) => 
                      Object.entries(semesters).map(([sem, subjects]) => 
                        subjects.map(subject => (
                          <Chip 
                            key={`${course}-${sem}-${subject}`}
                            label={`${subject} (${course} Sem ${sem})`} 
                            size="small" 
                            sx={{ backgroundColor: "#e3f2fd" }}
                          />
                        ))
                      )
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <IconButton onClick={() => openEdit(teacher)} color="primary">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDeleteTeacher(teacher.id)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </StyledTable>
      </StyledPaper>

      {/* Add Teacher Dialog */}
      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ backgroundColor: "#e3f2fd", color: "#2196f3" }}>
          Add New Teacher
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Teacher Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Select Courses</Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {COURSES.map(course => (
                  <FormControlLabel
                    key={course}
                    control={
                      <Checkbox
                        checked={formData.courses.includes(course)}
                        onChange={() => handleCourseChange(course)}
                      />
                    }
                    label={course}
                  />
                ))}
              </Box>
            </Grid>
            
            {formData.courses.map(course => (
              <Grid item xs={12} key={course}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>{course} - Select Subjects by Semester</Typography>
                    {SEMESTERS[course].map(semester => (
                      <Box key={semester} mb={2}>
                        <Typography variant="subtitle1" gutterBottom>
                          Semester {semester}
                        </Typography>
                        <Box display="flex" flexWrap="wrap" gap={1}>
                          {(SUBJECTS_BY_SEMESTER[course][semester] || []).map(subject => (
                            <FormControlLabel
                              key={subject}
                              control={
                                <Checkbox
                                  checked={
                                    formData.courseSubjects[course]?.[semester]?.includes(subject) || false
                                  }
                                  onChange={() => handleSubjectChange(course, semester, subject)}
                                  size="small"
                                />
                              }
                              label={subject}
                            />
                          ))}
                        </Box>
                      </Box>
                    ))}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setOpenAddDialog(false); resetForm(); }}>Cancel</Button>
          <Button onClick={handleAddTeacher} variant="contained" disabled={!formData.name || loading}>
            Add Teacher
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Teacher Dialog */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ backgroundColor: "#e3f2fd", color: "#2196f3" }}>
          Edit Teacher
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Teacher Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Select Courses</Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {COURSES.map(course => (
                  <FormControlLabel
                    key={course}
                    control={
                      <Checkbox
                        checked={formData.courses.includes(course)}
                        onChange={() => handleCourseChange(course)}
                      />
                    }
                    label={course}
                  />
                ))}
              </Box>
            </Grid>
            
            {formData.courses.map(course => (
              <Grid item xs={12} key={course}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>{course} - Select Subjects by Semester</Typography>
                    {SEMESTERS[course].map(semester => (
                      <Box key={semester} mb={2}>
                        <Typography variant="subtitle1" gutterBottom>
                          Semester {semester}
                        </Typography>
                        <Box display="flex" flexWrap="wrap" gap={1}>
                          {(SUBJECTS_BY_SEMESTER[course][semester] || []).map(subject => (
                            <FormControlLabel
                              key={subject}
                              control={
                                <Checkbox
                                  checked={
                                    formData.courseSubjects[course]?.[semester]?.includes(subject) || false
                                  }
                                  onChange={() => handleSubjectChange(course, semester, subject)}
                                  size="small"
                                />
                              }
                              label={subject}
                            />
                          ))}
                        </Box>
                      </Box>
                    ))}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setOpenEditDialog(false); resetForm(); }}>Cancel</Button>
          <Button onClick={handleUpdateTeacher} variant="contained" disabled={!formData.name || loading}>
            Update Teacher
          </Button>
        </DialogActions>
      </Dialog>
    </StyledContainer>
  );
}

export default TeacherManagementPage;
