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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Alert,
  Chip,
  Card,
  CardContent,
  Grid,
  Paper,
  IconButton,
  CircularProgress,
  Tabs,
  Tab,
} from "@mui/material";
import { styled } from "@mui/system";
import { 
  School, 
  People, 
  LibraryBooks,
  Add,
  Edit,
  Delete,
  Groups,
  Subject as SubjectIcon,
} from "@mui/icons-material";

const API_URL = "http://localhost:8000";

const StyledContainer = styled(Container)(({ theme }) => ({
  padding: theme.spacing(4),
  minHeight: "100vh",
}));

const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: "12px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  border: "1px solid #e2e8f0",
}));

const Header = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  marginBottom: theme.spacing(3),
  background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
  borderLeft: "4px solid #3b82f6",
  borderBottom: "1px solid #e2e8f0",
}));

function BatchManagement() {
  const [tabValue, setTabValue] = useState(0);
  const [batches, setBatches] = useState([]);
  const [sections, setSections] = useState({});
  const [subjects, setSubjects] = useState({});
  const [electiveGroups, setElectiveGroups] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  

  const [openBatchDialog, setOpenBatchDialog] = useState(false);
  const [openSectionDialog, setOpenSectionDialog] = useState(false);
  const [openSubjectDialog, setOpenSubjectDialog] = useState(false);
  const [openElectiveDialog, setOpenElectiveDialog] = useState(false);
  

  const [batchForm, setBatchForm] = useState({ name: "", batch_type: "", course: "", semester: "" });
  


  const batchTypes = ["B.Tech", "M.Tech", "BCA", "MCA", "B.Sc", "M.Sc", "BBA", "MBA"];
  const courses = ["CSE", "EE", "ME", "CE", "IT", "ECE", "AIML", "DS"];
  const [sectionForm, setSectionForm] = useState({ batch_id: "", section_letter: "", student_count: 0 });
  const [subjectForm, setSubjectForm] = useState({ 
    batch_id: "", code: "", name: "", subject_type: "core", elective_group_id: "", hours_per_week: 2 
  });
  const [electiveForm, setElectiveForm] = useState({ batch_id: "", name: "" });
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {

    setSections({});
    setSubjects({});
    setElectiveGroups({});
    fetchBatches();
  }, []);


  useEffect(() => {
    if (batches.length > 0) {

      setSections({});
      setSubjects({});
      setElectiveGroups({});
      

      batches.forEach(batch => {
        fetchSections(batch.id);
        fetchSubjects(batch.id);
        fetchElectiveGroups(batch.id);
      });
    }
  }, [batches]);

  const fetchBatches = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/batches`);
      setBatches(response.data.batches || []);
    } catch (error) {
      setMessage("Error fetching batches: " + (error.response?.data?.detail || error.message));
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const fetchSections = async (batchId) => {
    try {
      const response = await axios.get(`${API_URL}/batches/${batchId}/sections`);
      setSections(prev => ({ ...prev, [batchId]: response.data.sections || [] }));
    } catch (error) {
      console.error("Error fetching sections:", error);
    }
  };

  const fetchSubjects = async (batchId) => {
    try {
      const response = await axios.get(`${API_URL}/batches/${batchId}/subjects`);
      setSubjects(prev => ({ ...prev, [batchId]: response.data.subjects || [] }));
    } catch (error) {
      console.error("Error fetching subjects:", error);
    }
  };

  const fetchElectiveGroups = async (batchId) => {
    try {
      const response = await axios.get(`${API_URL}/batches/${batchId}/elective-groups`);
      setElectiveGroups(prev => ({ ...prev, [batchId]: response.data.elective_groups || [] }));
    } catch (error) {
      console.error("Error fetching elective groups:", error);
    }
  };

  const handleCreateBatch = async () => {
    setLoading(true);
    try {

      const generatedName = `${batchForm.batch_type} ${batchForm.course} Semester ${batchForm.semester}`;
      
      await axios.post(`${API_URL}/batches`, {
        name: generatedName,
        batch_type: batchForm.batch_type,
        course: batchForm.course,
        semester: parseInt(batchForm.semester)
      });
      setMessage("Batch created successfully!");
      setMessageType("success");
      setOpenBatchDialog(false);
      setBatchForm({ name: "", batch_type: "", course: "", semester: "" });
      fetchBatches();
    } catch (error) {
      setMessage("Error creating batch: " + (error.response?.data?.detail || error.message));
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSection = async () => {
    setLoading(true);
    try {
      if (editMode && selectedBatch) {
        await axios.put(`${API_URL}/sections/${selectedBatch.id}`, sectionForm);
        setMessage("Section updated successfully!");
      } else {
        await axios.post(`${API_URL}/sections`, sectionForm);
        setMessage("Section created successfully!");
      }
      setMessageType("success");
      setOpenSectionDialog(false);
      setSectionForm({ batch_id: "", section_letter: "", student_count: 0 });
      setEditMode(false);
      setSelectedBatch(null);

      const response = await axios.get(`${API_URL}/batches/${sectionForm.batch_id}/sections`);
      setSections(prev => ({ ...prev, [sectionForm.batch_id]: response.data.sections }));
      fetchBatches();
    } catch (error) {
      setMessage("Error: " + (error.response?.data?.detail || error.message));
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubject = async () => {
    setLoading(true);
    try {
      if (editMode && selectedBatch) {
        await axios.put(`${API_URL}/subjects/${selectedBatch.id}`, subjectForm);
        setMessage("Subject updated successfully!");
      } else {
        await axios.post(`${API_URL}/subjects`, subjectForm);
        setMessage("Subject created successfully!");
      }
      setMessageType("success");
      setOpenSubjectDialog(false);
      setSubjectForm({ batch_id: "", code: "", name: "", subject_type: "core", elective_group_id: "", hours_per_week: 2 });
      setEditMode(false);
      setSelectedBatch(null);

      const response = await axios.get(`${API_URL}/batches/${subjectForm.batch_id}/subjects`);
      setSubjects(prev => ({ ...prev, [subjectForm.batch_id]: response.data.subjects }));
      fetchBatches();
    } catch (error) {
      setMessage("Error: " + (error.response?.data?.detail || error.message));
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateElective = async () => {
    setLoading(true);
    try {
      if (editMode && selectedBatch) {
        await axios.put(`${API_URL}/elective-groups/${selectedBatch.id}`, electiveForm);
        setMessage("Elective group updated successfully!");
      } else {
        await axios.post(`${API_URL}/elective-groups`, electiveForm);
        setMessage("Elective group created successfully!");
      }
      setMessageType("success");
      setOpenElectiveDialog(false);
      const batchId = electiveForm.batch_id;
      setElectiveForm({ batch_id: "", name: "" });
      setEditMode(false);
      setSelectedBatch(null);

      const response = await axios.get(`${API_URL}/batches/${batchId}/elective-groups`);
      setElectiveGroups(prev => ({ ...prev, [batchId]: response.data.elective_groups }));
      fetchBatches();
    } catch (error) {
      setMessage("Error: " + (error.response?.data?.detail || error.message));
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const handleEditBatch = (batch) => {
    setSelectedBatch(batch);
    setBatchForm({
      batch_type: batch.batch_type,
      course: batch.course,
      semester: batch.semester.toString(),
      name: batch.name
    });
    setEditMode(true);
    setOpenBatchDialog(true);
  };

  const handleDeleteBatch = async (batchId) => {
    if (window.confirm("Are you sure you want to delete this batch?")) {
      setLoading(true);
      try {
        await axios.delete(`${API_URL}/batches/${batchId}`);
        setMessage("Batch deleted successfully!");
        setMessageType("success");
        fetchBatches();
      } catch (error) {
        setMessage("Error deleting batch: " + (error.response?.data?.detail || error.message));
        setMessageType("error");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleUpdateBatch = async () => {
    setLoading(true);
    try {
      const generatedName = `${batchForm.batch_type} ${batchForm.course} Semester ${batchForm.semester}`;
      
      await axios.put(`${API_URL}/batches/${selectedBatch.id}`, {
        name: generatedName,
        batch_type: batchForm.batch_type,
        course: batchForm.course,
        semester: parseInt(batchForm.semester)
      });
      setMessage("Batch updated successfully!");
      setMessageType("success");
      setOpenBatchDialog(false);
      setBatchForm({ name: "", batch_type: "", course: "", semester: "" });
      setEditMode(false);
      setSelectedBatch(null);
      fetchBatches();
    } catch (error) {
      setMessage("Error updating batch: " + (error.response?.data?.detail || error.message));
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };


  const handleEditSection = (section, batchId) => {
    setSectionForm({
      batch_id: batchId,
      section_letter: section.section_letter,
      student_count: section.student_count
    });
    setSelectedBatch({ ...section });
    setEditMode(true);
    setOpenSectionDialog(true);
  };

  const handleDeleteSection = async (sectionId) => {
    if (window.confirm("Are you sure you want to delete this section?")) {
      setLoading(true);
      try {
        await axios.delete(`${API_URL}/sections/${sectionId}`);
        setMessage("Section deleted successfully!");
        setMessageType("success");
        fetchBatches();

        for (const batch of batches) {
          const response = await axios.get(`${API_URL}/batches/${batch.id}/sections`);
          setSections(prev => ({ ...prev, [batch.id]: response.data.sections }));
        }
      } catch (error) {
        setMessage("Error deleting section: " + (error.response?.data?.detail || error.message));
        setMessageType("error");
      } finally {
        setLoading(false);
      }
    }
  };


  const handleEditSubject = (subject, batchId) => {
    setSubjectForm({
      batch_id: batchId,
      code: subject.code,
      name: subject.name,
      subject_type: subject.subject_type,
      elective_group_id: subject.elective_group_id || "",
      hours_per_week: subject.hours_per_week
    });
    setSelectedBatch({ ...subject });
    setEditMode(true);
    setOpenSubjectDialog(true);
  };

  const handleDeleteSubject = async (subjectId) => {
    if (window.confirm("Are you sure you want to delete this subject?")) {
      setLoading(true);
      try {
        await axios.delete(`${API_URL}/subjects/${subjectId}`);
        setMessage("Subject deleted successfully!");
        setMessageType("success");
        fetchBatches();

        for (const batch of batches) {
          const response = await axios.get(`${API_URL}/batches/${batch.id}/subjects`);
          setSubjects(prev => ({ ...prev, [batch.id]: response.data.subjects }));
        }
      } catch (error) {
        setMessage("Error deleting subject: " + (error.response?.data?.detail || error.message));
        setMessageType("error");
      } finally {
        setLoading(false);
      }
    }
  };


  const handleEditElective = (elective, batchId) => {
    setElectiveForm({
      batch_id: batchId,
      name: elective.name
    });
    setSelectedBatch({ ...elective });
    setEditMode(true);
    setOpenElectiveDialog(true);
  };

  const handleDeleteElective = async (electiveId) => {
    if (window.confirm("Are you sure you want to delete this elective group?")) {
      setLoading(true);
      try {
        await axios.delete(`${API_URL}/elective-groups/${electiveId}`);
        setMessage("Elective group deleted successfully!");
        setMessageType("success");
        fetchBatches();

        for (const batch of batches) {
          const response = await axios.get(`${API_URL}/batches/${batch.id}/elective-groups`);
          setElectiveGroups(prev => ({ ...prev, [batch.id]: response.data.elective_groups }));
        }
      } catch (error) {
        setMessage("Error deleting elective group: " + (error.response?.data?.detail || error.message));
        setMessageType("error");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <StyledContainer maxWidth="xl">
      {/* Header */}
      <Header elevation={0}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <School sx={{ fontSize: 36, color: "#3b82f6" }} />
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: "#1e293b", mb: 0.5 }}>
                Batch & Subject Management
              </Typography>
              <Typography variant="body1" sx={{ color: "#64748b" }}>
                Manage batches, sections, subjects, and electives
              </Typography>
            </Box>
          </Box>
        </Box>
      </Header>

      {/* Tabs */}
      <StyledCard>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs value={tabValue} onChange={(e, val) => setTabValue(val)}>
            <Tab icon={<School />} label="Batches" />
            <Tab icon={<Groups />} label="Sections" />
            <Tab icon={<SubjectIcon />} label="Subjects" />
            <Tab icon={<LibraryBooks />} label="Electives" />
          </Tabs>
        </Box>

        {message && (
          <Alert severity={messageType} sx={{ m: 2 }} onClose={() => setMessage("")}>
            {message}
          </Alert>
        )}

        {/* Batches Tab */}
        {tabValue === 0 && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                All Batches
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => {
                  setBatchForm({ name: "", batch_type: "", course: "", semester: "" });
                  setOpenBatchDialog(true);
                }}
              >
                Add Batch
              </Button>
            </Box>

            {loading ? (
              <CircularProgress />
            ) : (
              <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Batch Type</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Course</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Semester</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
                <TableBody>
                  {batches.map((batch) => (
                    <TableRow key={batch.id}>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <School sx={{ color: "#3b82f6" }} />
                          <Typography sx={{ fontWeight: 600 }}>{batch.name}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip label={batch.batch_type} size="small" sx={{ backgroundColor: "#e0e7ff", color: "#4f46e5", fontWeight: 600 }} />
                      </TableCell>
                      <TableCell>{batch.course}</TableCell>
                      <TableCell>Sem {batch.semester}</TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => handleEditBatch(batch)} title="Edit">
                          <Edit />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDeleteBatch(batch.id)} title="Delete">
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Box>
        )}
        {/* Sections Tab */}
        {tabValue === 1 && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                All Sections
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => {
                  setSectionForm({ batch_id: "", section_letter: "", student_count: 0 });
                  setOpenSectionDialog(true);
                }}
              >
                Add Section
              </Button>
            </Box>

            {Object.keys(sections).length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ p: 4, textAlign: "center" }}>
                No sections found. Add sections for a batch.
              </Typography>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Batch</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Section</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Student Count</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(sections).flatMap(([batchId, batchSections]) =>
                    batchSections.map((section) => (
                      <TableRow key={section.id}>
                        <TableCell>{batches.find(b => b.id === batchId)?.name || "Unknown"}</TableCell>
                        <TableCell>
                          <Chip label={section.section_letter} size="small" sx={{ fontWeight: 600 }} />
                        </TableCell>
                        <TableCell>{section.student_count}</TableCell>
                        <TableCell align="right">
                          <IconButton size="small" onClick={() => handleEditSection(section, batchId)} title="Edit"><Edit /></IconButton>
                          <IconButton size="small" onClick={() => handleDeleteSection(section.id)} title="Delete"><Delete /></IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </Box>
        )}

        {/* Subjects Tab */}
        {tabValue === 2 && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                All Subjects
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => {
                  setSubjectForm({ batch_id: "", code: "", name: "", subject_type: "core", elective_group_id: "", hours_per_week: 2 });
                  setOpenSubjectDialog(true);
                }}
              >
                Add Subject
              </Button>
            </Box>

            {Object.keys(subjects).length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ p: 4, textAlign: "center" }}>
                No subjects found. Add subjects for a batch.
              </Typography>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Code</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Hours/Week</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(subjects).flatMap(([batchId, batchSubjects]) =>
                    batchSubjects.map((subject) => (
                      <TableRow key={subject.id}>
                        <TableCell>
                          <Chip label={subject.code} size="small" sx={{ fontWeight: 700 }} />
                        </TableCell>
                        <TableCell>{subject.name}</TableCell>
                        <TableCell>
                          <Chip 
                            label={subject.subject_type} 
                            size="small" 
                            sx={{ 
                              backgroundColor: subject.subject_type === "lab" ? "#fef3c7" : subject.subject_type === "elective" ? "#d1fae5" : "#dbeafe",
                              color: subject.subject_type === "lab" ? "#92400e" : subject.subject_type === "elective" ? "#065f46" : "#1e40af"
                            }} 
                          />
                        </TableCell>
                        <TableCell>{subject.hours_per_week}</TableCell>
                        <TableCell align="right">
                          <IconButton size="small" onClick={() => handleEditSubject(subject, batchId)} title="Edit"><Edit /></IconButton>
                          <IconButton size="small" onClick={() => handleDeleteSubject(subject.id)} title="Delete"><Delete /></IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </Box>
        )}

        {/* Electives Tab */}
        {tabValue === 3 && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Elective Groups (Optional)
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => {
                  setElectiveForm({ batch_id: "", name: "" });
                  setOpenElectiveDialog(true);
                }}
              >
                Add Elective Group
              </Button>
            </Box>

            {Object.keys(electiveGroups).length === 0 ? (
              <Box sx={{ p: 4, textAlign: "center", border: "2px dashed #e2e8f0", borderRadius: "8px", backgroundColor: "#f8fafc" }}>
                <Typography variant="body2" sx={{ color: "#64748b", mb: 1 }}>
                  No elective groups created yet. Electives are optional.
                </Typography>
                <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                  Create elective groups if you want electives in this batch
                </Typography>
              </Box>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Batch</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Elective Group</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(electiveGroups).flatMap(([batchId, groups]) =>
                    groups.map((group) => (
                      <TableRow key={group.id}>
                        <TableCell>{batches.find(b => b.id === batchId)?.name || "Unknown"}</TableCell>
                        <TableCell>
                          <Chip label={group.name} size="small" sx={{ backgroundColor: "#e0e7ff", color: "#4f46e5", fontWeight: 600 }} />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton size="small" onClick={() => handleEditElective(group, batchId)} title="Edit"><Edit /></IconButton>
                          <IconButton size="small" onClick={() => handleDeleteElective(group.id)} title="Delete"><Delete /></IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </Box>
        )}
      </StyledCard>

      {/* Create Batch Dialog */}
      <Dialog open={openBatchDialog} onClose={() => setOpenBatchDialog(false)} maxWidth="sm" fullWidth>
            <DialogTitle>{editMode ? "Edit Batch" : "Create New Batch"}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Batch Type</InputLabel>
              <Select
                value={batchForm.batch_type}
                label="Batch Type"
                onChange={(e) => setBatchForm({ ...batchForm, batch_type: e.target.value })}
              >
                {batchTypes.map((type) => (
                  <MenuItem key={type} value={type}>{type}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Course</InputLabel>
              <Select
                value={batchForm.course}
                label="Course"
                onChange={(e) => setBatchForm({ ...batchForm, course: e.target.value })}
              >
                {courses.map((course) => (
                  <MenuItem key={course} value={course}>{course}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Semester"
              type="number"
              value={batchForm.semester}
              onChange={(e) => setBatchForm({ ...batchForm, semester: e.target.value })}
              fullWidth
              inputProps={{ min: 1, max: 8 }}
              helperText="Select semester (1-8)"
            />
            <Box sx={{ p: 2, backgroundColor: "#f8fafc", borderRadius: "8px" }}>
              <Typography variant="caption" sx={{ color: "#64748b" }}>
                Batch name will be auto-generated as: <strong>{batchForm.batch_type} {batchForm.course} Semester {batchForm.semester}</strong>
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
            <Button onClick={() => {
              setOpenBatchDialog(false);
              setEditMode(false);
              setSelectedBatch(null);
              setBatchForm({ name: "", batch_type: "", course: "", semester: "" });
            }}>Cancel</Button>
          <Button variant="contained" onClick={editMode ? handleUpdateBatch : handleCreateBatch} disabled={loading || !batchForm.batch_type || !batchForm.course || !batchForm.semester}>
            {editMode ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create/Edit Section Dialog */}
      <Dialog open={openSectionDialog} onClose={() => {
        setOpenSectionDialog(false);
        setEditMode(false);
        setSelectedBatch(null);
        setSectionForm({ batch_id: "", section_letter: "", student_count: 0 });
      }} maxWidth="sm" fullWidth>
        <DialogTitle>{editMode ? "Edit Section" : "Add Section to Batch"}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Batch</InputLabel>
              <Select
                value={sectionForm.batch_id}
                label="Batch"
                onChange={(e) => setSectionForm({ ...sectionForm, batch_id: e.target.value })}
              >
                {batches.map((batch) => (
                  <MenuItem key={batch.id} value={batch.id}>{batch.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Section Letter"
              value={sectionForm.section_letter}
              onChange={(e) => setSectionForm({ ...sectionForm, section_letter: e.target.value.toUpperCase() })}
              fullWidth
              placeholder="A, B, C..."
            />
            <TextField
              label="Student Count"
              type="number"
              value={sectionForm.student_count}
              onChange={(e) => setSectionForm({ ...sectionForm, student_count: parseInt(e.target.value) || 0 })}
              fullWidth
              inputProps={{ min: 0 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenSectionDialog(false);
            setEditMode(false);
            setSelectedBatch(null);
            setSectionForm({ batch_id: "", section_letter: "", student_count: 0 });
          }}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateSection} disabled={loading || !sectionForm.batch_id || !sectionForm.section_letter}>
            {editMode ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create/Edit Subject Dialog */}
      <Dialog open={openSubjectDialog} onClose={() => {
        setOpenSubjectDialog(false);
        setEditMode(false);
        setSelectedBatch(null);
        setSubjectForm({ batch_id: "", code: "", name: "", subject_type: "core", elective_group_id: "", hours_per_week: 2 });
      }} maxWidth="sm" fullWidth>
        <DialogTitle>{editMode ? "Edit Subject" : "Add Subject to Batch"}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Batch</InputLabel>
              <Select
                value={subjectForm.batch_id}
                label="Batch"
                onChange={(e) => setSubjectForm({ ...subjectForm, batch_id: e.target.value })}
              >
                {batches.map((batch) => (
                  <MenuItem key={batch.id} value={batch.id}>{batch.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Subject Code"
              value={subjectForm.code}
              onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
              fullWidth
              placeholder="e.g., TCS-408"
            />
            <TextField
              label="Subject Name"
              value={subjectForm.name}
              onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
              fullWidth
              placeholder="e.g., Data Structures"
            />
            <FormControl fullWidth>
              <InputLabel>Subject Type</InputLabel>
              <Select
                value={subjectForm.subject_type}
                label="Subject Type"
                onChange={(e) => setSubjectForm({ ...subjectForm, subject_type: e.target.value })}
              >
                <MenuItem value="core">Core</MenuItem>
                <MenuItem value="lab">Lab</MenuItem>
                <MenuItem value="elective">Elective</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Hours per Week"
              type="number"
              value={subjectForm.hours_per_week}
              onChange={(e) => setSubjectForm({ ...subjectForm, hours_per_week: parseInt(e.target.value) || 2 })}
              fullWidth
              inputProps={{ min: 1, max: 10 }}
              helperText="Total teaching hours per week. Examples: Core subjects = 3 hrs, Labs = 4 hrs, Theory = 2 hrs"
            />
            <Box sx={{ p: 2, backgroundColor: "#f0f9ff", borderRadius: "8px", border: "1px solid #bae6fd" }}>
              <Typography variant="caption" sx={{ color: "#0369a1", fontWeight: 600, display: "block", mb: 0.5 }}>
                💡 Hours per Week Examples:
              </Typography>
              <Typography variant="caption" sx={{ color: "#0369a1", display: "block" }}>
                • Core Theory: 3 hours/week
              </Typography>
              <Typography variant="caption" sx={{ color: "#0369a1", display: "block" }}>
                • Lab Subjects (PCS): 4 hours/week (2 sessions × 2 hours)
              </Typography>
              <Typography variant="caption" sx={{ color: "#0369a1", display: "block" }}>
                • Electives: 2-4 hours/week
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenSubjectDialog(false);
            setEditMode(false);
            setSelectedBatch(null);
            setSubjectForm({ batch_id: "", code: "", name: "", subject_type: "core", elective_group_id: "", hours_per_week: 2 });
          }}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateSubject} disabled={loading || !subjectForm.batch_id || !subjectForm.code || !subjectForm.name}>
            {editMode ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create/Edit Elective Dialog (OPTIONAL) */}
      <Dialog open={openElectiveDialog} onClose={() => {
        setOpenElectiveDialog(false);
        setEditMode(false);
        setSelectedBatch(null);
        setElectiveForm({ batch_id: "", name: "" });
      }} maxWidth="sm" fullWidth>
        <DialogTitle>{editMode ? "Edit Elective Group" : "Create Elective Group (Optional)"}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Batch</InputLabel>
              <Select
                value={electiveForm.batch_id}
                label="Batch"
                onChange={(e) => setElectiveForm({ ...electiveForm, batch_id: e.target.value })}
              >
                {batches.map((batch) => (
                  <MenuItem key={batch.id} value={batch.id}>{batch.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Elective Group Name"
              value={electiveForm.name}
              onChange={(e) => setElectiveForm({ ...electiveForm, name: e.target.value })}
              fullWidth
              placeholder="e.g., Professional Electives"
            />
            <Alert severity="info" sx={{ mt: 1 }}>
              Electives are optional. Only create if you want elective subjects in this batch.
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenElectiveDialog(false);
            setEditMode(false);
            setSelectedBatch(null);
            setElectiveForm({ batch_id: "", name: "" });
          }}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateElective} disabled={loading || !electiveForm.batch_id || !electiveForm.name}>
            {editMode ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </StyledContainer>
  );
}

export default BatchManagement;

