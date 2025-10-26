import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Container,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Alert,
  Box,
  Grid,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { styled } from "@mui/system";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from "react-router-dom";

const API_URL = "http:

const StyledContainer = styled(Container)(({ theme }) => ({
  padding: theme.spacing(4),
  backgroundColor: "#f5f7fa",
  minHeight: "100vh",
}));

const HeaderSection = styled(Box)(({ theme }) => ({
  backgroundColor: "#fff",
  padding: theme.spacing(3),
  borderRadius: "8px",
  boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
  marginBottom: theme.spacing(3),
}));

const StyledCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  borderRadius: "8px",
  boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
  border: "1px solid #e0e0e0",
}));

const StyledTable = styled(Table)(({ theme }) => ({
  "& .MuiTableHead-root": {
    backgroundColor: "#2c3e50",
  },
  "& .MuiTableCell-head": {
    color: "#fff",
    fontWeight: 600,
  },
}));

function ClassroomManagement() {
  const navigate = useNavigate();
  const [classrooms, setClassrooms] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentClassroom, setCurrentClassroom] = useState(null);
  const [formData, setFormData] = useState({
    room_number: "",
    building: "",
    floor: "",
    capacity: "",
    room_type: "lecture",
    subjects: [],
  });
  const [availableSubjects, setAvailableSubjects] = useState([]);

  useEffect(() => {
    fetchClassrooms();
    loadAllSubjects();
    
    
    const intervalId = setInterval(() => {
      fetchClassrooms();
    }, 30000);
    
    return () => clearInterval(intervalId);
  }, []);

  const loadAllSubjects = async () => {
    try {
      
      const subjectSets = await Promise.all([
        axios.get(`${API_URL}/subjects/BTech/4`),
        axios.get(`${API_URL}/subjects/MCA/2`),
        axios.get(`${API_URL}/subjects/MBA/2`),
        axios.get(`${API_URL}/subjects/BCA/3`)
      ]);
      
      const allSubjects = new Set();
      subjectSets.forEach(response => {
        if (response.data.subjects) {
          response.data.subjects.forEach(subject => allSubjects.add(subject));
        }
      });
      
      setAvailableSubjects(Array.from(allSubjects).sort());
    } catch (error) {
      console.error("Error loading subjects:", error);
    }
  };

  const fetchClassrooms = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/classrooms`);
      setClassrooms(response.data.classrooms);
      setMessage("");
    } catch (error) {
      setMessage("Error fetching classrooms: " + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (classroom = null) => {
    if (classroom) {
      setEditMode(true);
      setCurrentClassroom(classroom);
      setFormData({
        room_number: classroom.room_number,
        building: classroom.building || "",
        floor: classroom.floor || "",
        capacity: classroom.capacity,
        room_type: classroom.room_type,
        subjects: classroom.subjects || [],
      });
    } else {
      setEditMode(false);
      setCurrentClassroom(null);
      setFormData({
        room_number: "",
        building: "",
        floor: "",
        capacity: "",
        room_type: "lecture",
        subjects: [],
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditMode(false);
    setCurrentClassroom(null);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (editMode && currentClassroom) {
        await axios.put(`${API_URL}/update_classroom/${currentClassroom.id}`, formData);
        setMessage("Classroom updated successfully!");
      } else {
        await axios.post(`${API_URL}/add_classroom`, formData);
        setMessage("Classroom added successfully!");
      }
      fetchClassrooms();
      handleCloseDialog();
    } catch (error) {
      setMessage("Error: " + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (classroomId) => {
    if (!window.confirm("Are you sure you want to delete this classroom?")) {
      return;
    }
    setLoading(true);
    try {
      await axios.delete(`${API_URL}/delete_classroom/${classroomId}`);
      setMessage("Classroom deleted successfully!");
      fetchClassrooms();
    } catch (error) {
      setMessage("Error deleting classroom: " + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const getRoomTypeColor = (type) => {
    switch (type) {
      case "lab":
        return "#e3f2fd";
      case "lecture":
        return "#f3e5f5";
      case "seminar":
        return "#e8f5e9";
      default:
        return "#f5f5f5";
    }
  };

  return (
    <StyledContainer maxWidth="xl">
      <HeaderSection>
        <Grid container alignItems="center" justifyContent="space-between">
          <Grid item>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <IconButton onClick={() => navigate("/admin")} sx={{ color: "#2c3e50" }}>
                <ArrowBackIcon />
              </IconButton>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 600, color: "#2c3e50", display: "flex", alignItems: "center", gap: 1 }}>
                  <MeetingRoomIcon sx={{ fontSize: 32 }} />
                  Classroom Management
                </Typography>
                <Typography variant="body2" sx={{ color: "#7f8c8d", mt: 0.5 }}>
                  Manage rooms, labs, and lecture halls
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              sx={{
                backgroundColor: "#27ae60",
                "&:hover": { backgroundColor: "#229954" },
                textTransform: "none",
                fontWeight: 600,
              }}
            >
              Add Classroom
            </Button>
          </Grid>
        </Grid>
      </HeaderSection>

      {message && (
        <Alert
          severity={message.includes("Error") ? "error" : "success"}
          sx={{ mb: 2, borderRadius: "8px" }}
          onClose={() => setMessage("")}
        >
          {message}
        </Alert>
      )}

      <StyledCard>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Available Classrooms ({classrooms.length})
          </Typography>
          <StyledTable>
            <TableHead>
              <TableRow>
                <TableCell>Room Number</TableCell>
                <TableCell>Building</TableCell>
                <TableCell>Floor</TableCell>
                <TableCell>Capacity</TableCell>
                <TableCell>Room Type</TableCell>
                <TableCell>Designated Subjects</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {classrooms.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography sx={{ color: "#7f8c8d", py: 4 }}>
                      No classrooms found. Add one to get started.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                classrooms.map((classroom) => (
                  <TableRow key={classroom.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{classroom.room_number}</TableCell>
                    <TableCell>{classroom.building || "—"}</TableCell>
                    <TableCell>{classroom.floor || "—"}</TableCell>
                    <TableCell>{classroom.capacity}</TableCell>
                    <TableCell>
                      <Chip
                        label={classroom.room_type.toUpperCase()}
                        size="small"
                        sx={{
                          backgroundColor: getRoomTypeColor(classroom.room_type),
                          color: "#2c3e50",
                          fontWeight: 600,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      {classroom.subjects && classroom.subjects.length > 0 ? (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {classroom.subjects.map((subject) => (
                            <Chip key={subject} label={subject} size="small" />
                          ))}
                        </Box>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          All subjects
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        onClick={() => handleOpenDialog(classroom)}
                        sx={{ color: "#3498db" }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => handleDelete(classroom.id)}
                        sx={{ color: "#e74c3c" }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </StyledTable>
        </CardContent>
      </StyledCard>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editMode ? "Edit Classroom" : "Add New Classroom"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              fullWidth
              label="Room Number"
              value={formData.room_number}
              onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Building"
              value={formData.building}
              onChange={(e) => setFormData({ ...formData, building: e.target.value })}
            />
            <TextField
              fullWidth
              label="Floor"
              value={formData.floor}
              onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
            />
            <TextField
              fullWidth
              label="Capacity"
              type="number"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || "" })}
              required
            />
            <FormControl fullWidth required>
              <InputLabel>Room Type</InputLabel>
              <Select
                value={formData.room_type}
                onChange={(e) => setFormData({ ...formData, room_type: e.target.value })}
                label="Room Type"
              >
                <MenuItem value="lecture">Lecture</MenuItem>
                <MenuItem value="lab">Lab</MenuItem>
                <MenuItem value="seminar">Seminar</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl fullWidth>
              <InputLabel>Designated Subjects (Optional)</InputLabel>
              <Select
                multiple
                value={formData.subjects}
                onChange={(e) => setFormData({ ...formData, subjects: e.target.value })}
                label="Designated Subjects (Optional)"
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} size="small" />
                    ))}
                  </Box>
                )}
              >
                <MenuItem value="">
                  <em>All Subjects (General Purpose)</em>
                </MenuItem>
                {availableSubjects.map((subject) => (
                  <MenuItem key={subject} value={subject}>
                    {subject}
                  </MenuItem>
                ))}
              </Select>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, ml: 1 }}>
                Leave empty for general purpose rooms, or select specific subjects for specialized labs
              </Typography>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading || !formData.room_number || !formData.capacity}
            sx={{
              backgroundColor: "#27ae60",
              "&:hover": { backgroundColor: "#229954" },
            }}
          >
            {editMode ? "Update" : "Add"}
          </Button>
        </DialogActions>
      </Dialog>
    </StyledContainer>
  );
}

export default ClassroomManagement;

