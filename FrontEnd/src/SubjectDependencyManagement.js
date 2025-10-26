import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Chip,
  Alert,
  Grid,
  Card,
  CardContent,
} from "@mui/material";
import { Add, Edit, Delete, School } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:8000";

function SubjectDependencyManagement() {
  const navigate = useNavigate();
  const [dependencies, setDependencies] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedDependency, setSelectedDependency] = useState(null);

  const [formData, setFormData] = useState({
    subject_code: "",
    dependent_subject_code: "",
    dependency_type: "prerequisite",
    priority: 5,
    gap_days: 0,
    same_day: false,
  });

  useEffect(() => {
    fetchDependencies();
    fetchSubjects();
  }, []);

  const fetchDependencies = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/subject-dependencies`);
      setDependencies(response.data.dependencies || []);
    } catch (error) {
      setMessage("Error loading dependencies: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await axios.get(`${API_URL}/batches`);
      const batches = response.data.batches || [];
      const allSubjects = new Set();
      
      for (const batch of batches) {
        const subjectsResponse = await axios.get(`${API_URL}/batches/${batch.id}/subjects`);
        const batchSubjects = subjectsResponse.data.subjects || [];
        batchSubjects.forEach(subj => allSubjects.add(subj.code));
      }
      
      setSubjects(Array.from(allSubjects).sort());
    } catch (error) {
      console.error("Error loading subjects:", error);
    }
  };

  const handleOpenDialog = (dependency = null) => {
    if (dependency) {
      setEditMode(true);
      setSelectedDependency(dependency);
      setFormData({
        subject_code: dependency.subject_code,
        dependent_subject_code: dependency.dependent_subject_code,
        dependency_type: dependency.dependency_type,
        priority: dependency.priority,
        gap_days: dependency.gap_days,
        same_day: dependency.same_day,
      });
    } else {
      setEditMode(false);
      setSelectedDependency(null);
      setFormData({
        subject_code: "",
        dependent_subject_code: "",
        dependency_type: "prerequisite",
        priority: 5,
        gap_days: 0,
        same_day: false,
      });
    }
    setOpenDialog(true);
  };

  const handleSave = async () => {
    if (!formData.subject_code || !formData.dependent_subject_code) {
      setMessage("Please fill all required fields");
      return;
    }

    setLoading(true);
    try {
      if (editMode) {
        await axios.put(`${API_URL}/subject-dependencies/${selectedDependency.id}`, formData);
        setMessage("Dependency updated successfully!");
      } else {
        await axios.post(`${API_URL}/subject-dependencies`, formData);
        setMessage("Dependency created successfully!");
      }
      setOpenDialog(false);
      fetchDependencies();
    } catch (error) {
      setMessage("Error saving dependency: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this dependency?")) {
      return;
    }

    setLoading(true);
    try {
      await axios.delete(`${API_URL}/subject-dependencies/${id}`);
      setMessage("Dependency deleted successfully!");
      fetchDependencies();
    } catch (error) {
      setMessage("Error deleting dependency: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getDependencyTypeColor = (type) => {
    switch (type) {
      case "prerequisite":
        return "primary";
      case "corequisite":
        return "secondary";
      case "theory_lab_pair":
        return "success";
      default:
        return "default";
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Paper sx={{ p: 4, mb: 3, background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "white" }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 1 }}>
              <School /> Subject Dependencies & Sequencing
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Define prerequisites, corequisites, and theory-lab relationships for intelligent timetable generation
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
            sx={{ bgcolor: "rgba(255,255,255,0.2)", "&:hover": { bgcolor: "rgba(255,255,255,0.3)" } }}
          >
            Add Dependency
          </Button>
        </Box>
      </Paper>

      {message && (
        <Alert severity={message.includes("Error") ? "error" : "success"} sx={{ mb: 3 }} onClose={() => setMessage("")}>
          {message}
        </Alert>
      )}

      {/* Info Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Prerequisites</Typography>
              <Typography variant="body2" color="text.secondary">
                Define which subjects must be completed before others (e.g., Data Structures before Advanced Algorithms)
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Corequisites</Typography>
              <Typography variant="body2" color="text.secondary">
                Subjects that should be taken together in the same semester
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Theory-Lab Pairs</Typography>
              <Typography variant="body2" color="text.secondary">
                Automatically schedule theory before corresponding lab with optimal gap days
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Dependencies Table */}
      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Subject</strong></TableCell>
              <TableCell><strong>Related Subject</strong></TableCell>
              <TableCell><strong>Type</strong></TableCell>
              <TableCell><strong>Priority</strong></TableCell>
              <TableCell><strong>Gap Days</strong></TableCell>
              <TableCell><strong>Same Day</strong></TableCell>
              <TableCell align="right"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {dependencies.map((dep) => (
              <TableRow key={dep.id}>
                <TableCell>{dep.subject_code}</TableCell>
                <TableCell>{dep.dependent_subject_code}</TableCell>
                <TableCell>
                  <Chip
                    label={dep.dependency_type.replace("_", " ")}
                    size="small"
                    color={getDependencyTypeColor(dep.dependency_type)}
                  />
                </TableCell>
                <TableCell>{dep.priority}/10</TableCell>
                <TableCell>{dep.gap_days}</TableCell>
                <TableCell>{dep.same_day ? "Yes" : "No"}</TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => handleOpenDialog(dep)}>
                    <Edit />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDelete(dep.id)}>
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editMode ? "Edit" : "Add"} Subject Dependency</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Subject</InputLabel>
                  <Select
                    value={formData.subject_code}
                    onChange={(e) => setFormData({ ...formData, subject_code: e.target.value })}
                    label="Subject"
                    disabled={editMode}
                  >
                    {subjects.map((subj) => (
                      <MenuItem key={subj} value={subj}>{subj}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Related Subject</InputLabel>
                  <Select
                    value={formData.dependent_subject_code}
                    onChange={(e) => setFormData({ ...formData, dependent_subject_code: e.target.value })}
                    label="Related Subject"
                    disabled={editMode}
                  >
                    {subjects.map((subj) => (
                      <MenuItem key={subj} value={subj}>{subj}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Dependency Type</InputLabel>
                  <Select
                    value={formData.dependency_type}
                    onChange={(e) => setFormData({ ...formData, dependency_type: e.target.value })}
                    label="Dependency Type"
                  >
                    <MenuItem value="prerequisite">Prerequisite</MenuItem>
                    <MenuItem value="corequisite">Corequisite</MenuItem>
                    <MenuItem value="theory_lab_pair">Theory-Lab Pair</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Priority (0-10)"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                  inputProps={{ min: 0, max: 10 }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Gap Days"
                  value={formData.gap_days}
                  onChange={(e) => setFormData({ ...formData, gap_days: parseInt(e.target.value) })}
                />
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <input
                    type="checkbox"
                    checked={formData.same_day}
                    onChange={(e) => setFormData({ ...formData, same_day: e.target.checked })}
                  />
                  <Typography variant="body2">Schedule on same day</Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={loading}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default SubjectDependencyManagement;

