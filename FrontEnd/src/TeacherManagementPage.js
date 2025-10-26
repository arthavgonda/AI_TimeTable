import React, { useState, useEffect } from "react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import useAutoRefresh from "./hooks/useAutoRefresh";
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
  Chip,
  Box,
  Paper,
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
import SearchIcon from "@mui/icons-material/Search";
import PersonIcon from "@mui/icons-material/Person";
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate } from "react-router-dom";

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
    backgroundColor: "#f8fafc",
    borderBottom: "2px solid #e2e8f0",
  },
  "& .MuiTableRow-root:nth-of-type(odd)": {
    backgroundColor: "#ffffff",
  },
  "& .MuiTableRow-root:nth-of-type(even)": {
    backgroundColor: "#f8fafc",
  },
  "& .MuiTableRow-root:hover": {
    backgroundColor: "#f1f5f9 !important",
    cursor: "pointer",
    transition: "background-color 0.2s ease",
  },
  "& .MuiTableCell-root": {
    padding: "16px 12px",
    borderBottom: "1px solid #e2e8f0",
  },
  "& .MuiTableCell-head": {
    fontWeight: 600,
    fontSize: "13px",
    color: "#1e293b",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    borderBottom: "2px solid #e2e8f0",
  },
}));

function TeacherManagementPage() {
  const [teachers, setTeachers] = useState([]);
  const [filteredTeachers, setFilteredTeachers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [courses, setCourses] = useState([]);
  const [subjectsByCourse, setSubjectsByCourse] = useState({});
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();


  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    courses: [],
    courseSubjects: {}
  });


  const { data: teachersData, isLoading, refetch } = useQuery({
    queryKey: ['teachers'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/teachers`);
      return response.data.teachers || [];
    },
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
    staleTime: 10000,
  });


  const { NotificationComponent } = useAutoRefresh(refetch, {
    interval: 30000,
    enabled: true,
    showNotifications: true,
  });


  useEffect(() => {
    const fetchCoursesAndSubjects = async () => {
      try {

        const batchesResponse = await axios.get(`${API_URL}/batches`);
        const batches = batchesResponse.data.batches || [];
        

        const uniqueCourses = [...new Set(batches.map(b => b.batch_type))];
        setCourses(uniqueCourses);
        

        const subjectsMap = {};
        for (const batch of batches) {
          if (!subjectsMap[batch.batch_type]) {
            subjectsMap[batch.batch_type] = {};
          }
          

          try {
            const subjectsResponse = await axios.get(`${API_URL}/batches/${batch.id}/subjects`);
            const subjects = subjectsResponse.data.subjects || [];
            subjectsMap[batch.batch_type][batch.semester] = subjects.map(s => s.code);
          } catch (err) {
            console.error(`Error fetching subjects for batch ${batch.id}:`, err);
          }
        }
        
        setSubjectsByCourse(subjectsMap);
      } catch (error) {
        console.error("Error fetching courses and subjects:", error);
      }
    };
    
    fetchCoursesAndSubjects();
  }, []);
  

  useEffect(() => {
    if (teachersData) {
      setTeachers(teachersData);
      setFilteredTeachers(teachersData);
      if (!isLoading) {
        setMessage("Teachers loaded successfully!");
      }
    }
  }, [teachersData, isLoading]);


  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/teachers`);
      const teachersList = response.data.teachers || [];
      setTeachers(teachersList);
      setFilteredTeachers(teachersList);
      setMessage("Teachers loaded successfully!");
      refetch();
    } catch (error) {
      setMessage("Error loading teachers: " + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredTeachers(teachers);
    } else {
      const query = searchQuery.toLowerCase().trim();
      const filtered = teachers.filter(teacher =>
        teacher.name.toLowerCase().includes(query) ||
        (teacher.email && teacher.email.toLowerCase().includes(query)) ||
        (teacher.phone && teacher.phone.toLowerCase().includes(query))
      );
      setFilteredTeachers(filtered);
    }
  }, [searchQuery, teachers]);

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
      {NotificationComponent}
      <StyledPaper>
        <Box 
          display="flex" 
          justifyContent="space-between" 
          alignItems="center" 
          mb={3}
          sx={{
            backgroundColor: "#f8fafc",
            padding: "20px 24px",
            borderRadius: "12px",
            borderLeft: "4px solid #3b82f6",
          }}
        >
          <Box>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 700, 
                color: "#1e293b",
                fontSize: "28px",
                mb: 0.5
              }}
            >
              Teacher Management
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: "#64748b",
                fontSize: "14px"
              }}
            >
              Manage and organize your teaching staff
            </Typography>
          </Box>
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
          <Box
            sx={{
              position: 'fixed',
              top: 20,
              right: 20,
              zIndex: 9999,
              minWidth: '300px',
              maxWidth: '400px',
              backgroundColor: message.includes("Error") ? '#fee' : '#efe',
              color: message.includes("Error") ? '#c33' : '#2c3e50',
              padding: '16px 20px',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              borderLeft: `4px solid ${message.includes("Error") ? '#e74c3c' : '#27ae60'}`,
              animation: 'slideIn 0.3s ease-out',
              mb: 2
            }}
          >
            {message.includes("Error") ? (
              <Box sx={{ fontSize: '24px' }}></Box>
            ) : (
              <Box sx={{ fontSize: '24px' }}></Box>
            )}
            <Box sx={{ flex: 1, fontSize: '14px', fontWeight: 500 }}>
              {message}
            </Box>
            <IconButton 
              size="small" 
              onClick={() => setMessage("")}
              sx={{ 
                color: 'inherit',
                '&:hover': { backgroundColor: 'rgba(0,0,0,0.05)' }
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        )}
        
        <style>
          {`
            @keyframes slideIn {
              from {
                transform: translateX(100%);
                opacity: 0;
              }
              to {
                transform: translateX(0);
                opacity: 1;
              }
            }
          `}
        </style>

        {/* Search Bar */}
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Search teachers by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "10px",
                backgroundColor: "#ffffff",
                border: "1px solid #e2e8f0",
                "&:hover": {
                  borderColor: "#cbd5e1",
                },
                "&.Mui-focused": {
                  borderColor: "#3b82f6",
                },
              },
            }}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: "#64748b" }} />,
            }}
          />
          {searchQuery && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1.5 }}>
              <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 500 }}>
                Showing {filteredTeachers.length} of {teachers.length} teachers
              </Typography>
              <Chip 
                label={searchQuery} 
                size="small" 
                onDelete={() => setSearchQuery("")}
                sx={{ 
                  height: "20px",
                  backgroundColor: "#e0e7ff",
                  color: "#4f46e5",
                  "& .MuiChip-deleteIcon": {
                    fontSize: "14px"
                  }
                }}
              />
            </Box>
          )}
        </Box>

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
            {filteredTeachers.length === 0 && teachers.length > 0 ? (
              <TableRow>
                <TableCell colSpan={5} sx={{ textAlign: "center", py: 8 }}>
                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                    <SearchIcon sx={{ fontSize: 48, color: "#cbd5e1" }} />
                    <Typography variant="h6" sx={{ color: "#1e293b", fontWeight: 600 }}>
                      No teachers found
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#64748b" }}>
                      No teachers match "{searchQuery}"
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              filteredTeachers.map((teacher) => (
              <TableRow key={teacher.id}>
                <TableCell>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <PersonIcon sx={{ fontSize: 20, color: "#64748b" }} />
                    <Typography sx={{ fontWeight: 600, color: "#1e293b", fontSize: "15px" }}>
                      {teacher.name}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  {teacher.email ? (
                    <Typography sx={{ color: "#64748b" }}>{teacher.email}</Typography>
                  ) : (
                    <Typography sx={{ color: "#cbd5e1" }}>—</Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Box display="flex" flexWrap="wrap" gap={0.5}>
                    {(teacher.courses || []).length > 0 ? (
                      (teacher.courses || []).map(course => (
                        <Chip 
                          key={course} 
                          label={course} 
                          size="small" 
                          sx={{
                            backgroundColor: "#dbeafe",
                            color: "#1e40af",
                            fontWeight: 500,
                            height: "26px"
                          }}
                        />
                      ))
                    ) : (
                      <Typography sx={{ color: "#cbd5e1" }}>—</Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box display="flex" flexWrap="wrap" gap={0.5}>
                    {Object.entries(teacher.courseSubjects || {}).length > 0 ? (
                      Object.entries(teacher.courseSubjects || {}).map(([course, semesters]) => 
                        Object.entries(semesters).map(([sem, subjects]) => 
                          subjects.map(subject => (
                            <Chip 
                              key={`${course}-${sem}-${subject}`}
                              label={`${subject}`} 
                              size="small"
                              title={`${subject} (${course} Sem ${sem})`}
                              sx={{ 
                                backgroundColor: "#e0e7ff",
                                color: "#4f46e5",
                                fontWeight: 500,
                                height: "26px"
                              }}
                            />
                          ))
                        )
                      )
                    ) : (
                      <Typography sx={{ color: "#cbd5e1" }}>—</Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: "flex", gap: 0.5 }}>
                    <IconButton 
                      onClick={() => openEdit(teacher)} 
                      sx={{
                        color: "#3b82f6",
                        "&:hover": {
                          backgroundColor: "#dbeafe",
                        }
                      }}
                      title="Edit teacher"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to delete ${teacher.name}?`)) {
                          handleDeleteTeacher(teacher.id);
                        }
                      }}
                      sx={{
                        color: "#ef4444",
                        "&:hover": {
                          backgroundColor: "#fee2e2",
                        }
                      }}
                      title="Delete teacher"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))
            )}
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
                {courses.map(course => (
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
                    {subjectsByCourse[course] && Object.keys(subjectsByCourse[course]).sort((a, b) => parseInt(a) - parseInt(b)).map(semester => (
                      <Box key={semester} mb={2}>
                        <Typography variant="subtitle1" gutterBottom>
                          Semester {semester}
                        </Typography>
                        <Box display="flex" flexWrap="wrap" gap={1}>
                          {(subjectsByCourse[course][semester] || []).map(subject => (
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
                {courses.map(course => (
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
                    {subjectsByCourse[course] && Object.keys(subjectsByCourse[course]).sort((a, b) => parseInt(a) - parseInt(b)).map(semester => (
                      <Box key={semester} mb={2}>
                        <Typography variant="subtitle1" gutterBottom>
                          Semester {semester}
                        </Typography>
                        <Box display="flex" flexWrap="wrap" gap={1}>
                          {(subjectsByCourse[course][semester] || []).map(subject => (
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
