import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Container,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Alert,
  Box,
  Grid,
  Chip,
  Card,
  CardContent,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  AppBar,
  Toolbar,
  IconButton as AppBarIconButton,
} from "@mui/material";
import { styled } from "@mui/system";
import EditIcon from "@mui/icons-material/Edit";
import MenuIcon from "@mui/icons-material/Menu";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:8000";

const SECTIONS = ["A", "B", "C", "D", "E", "F", "G", "H", "ARQ", "DS1", "DS2", "ML1", "ML2", "Cyber", "AI"];
const SUBJECTS = [
  "TCS-408", "TCS-402", "TCS-403", "TCS-409", "XCS-401", "TOC-401",
  "Elective", "PCS-408", "PCS-403", "PCS-409", "DP900", "AI900", "NDE"
];

const StyledContainer = styled(Container)(({ theme }) => ({
  padding: theme.spacing(4),
  backgroundColor: "#f5f7fa",
  minHeight: "100vh",
  position: "relative",
}));

const StyledCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(4),
  borderRadius: "12px",
  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
  backgroundColor: "#ffffff",
}));

const StyledButton = styled(Button)(({ theme }) => ({
  margin: theme.spacing(1),
  padding: theme.spacing(1.5, 3),
  borderRadius: "8px",
  textTransform: "none",
  fontWeight: "bold",
  "&:hover": {
    transform: "translateY(-2px)",
    transition: "transform 0.2s ease-in-out",
  },
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  margin: theme.spacing(1),
  "& .MuiOutlinedInput-root": {
    borderRadius: "8px",
    backgroundColor: "#f9f9f9",
    "& fieldset": {
      borderColor: "#b0bec5",
    },
    "&:hover fieldset": {
      borderColor: "#64b5f6",
    },
    "&.Mui-focused fieldset": {
      borderColor: "#2196f3",
    },
  },
}));

function AdminDashboard() {
  const today = new Date();
  const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };
  const [date, setDate] = useState(formatDate(today));
  const [timetable, setTimetable] = useState(null);
  const [endDate, setEndDate] = useState("");
  const [teacherAvailability, setTeacherAvailability] = useState({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [editSubjects, setEditSubjects] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();

  const parseDate = (dateStr) => {
    const [day, month, year] = dateStr.split("-");
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        const [timetableResponse, availabilityResponse] = await Promise.all([
          axios.get(`${API_URL}/timetable/${parseDate(date)}`),
          axios.get(`${API_URL}/teacher_availability`),
        ]);
        setTimetable(timetableResponse.data.timetable || {});
        setEndDate(formatDate(new Date(timetableResponse.data.end_date)));
        setTeacherAvailability(availabilityResponse.data);
        setMessage("Data refreshed successfully!");
      } catch (error) {
        setMessage("Error refreshing data: " + (error.response?.data?.error || error.message));
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, [date, refreshTrigger]);

  const fetchTimetable = async () => {
    setLoading(true);
    try {
      const backendDate = parseDate(date);
      const response = await axios.get(`${API_URL}/timetable/${backendDate}`);
      setTimetable(response.data.timetable || {});
      setEndDate(formatDate(new Date(response.data.end_date)));
      setMessage("Timetable fetched successfully!");
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      setMessage("Error fetching timetable: " + (error.response?.data?.error || error.message));
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateTimetable = async () => {
    setLoading(true);
    setMessage("Generating timetable...");
    try {
      const backendDate = parseDate(date);
      const response = await axios.get(`${API_URL}/generate?date=${backendDate}`, { timeout: 120000 });
      setTimetable(response.data.timetable || {});
      setEndDate(formatDate(new Date(response.data.end_date)));
      setDate(formatDate(new Date(response.data.date)));
      setMessage("Timetable generated successfully!");
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      setMessage("Error generating timetable: " + (error.response?.data?.error || error.message));
      console.error("Generate error:", error);
    } finally {
      setLoading(false);
    }
  };

  const sendNotifications = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/notify`);
      setMessage(response.data.message);
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      setMessage("Error sending notifications: " + (error.response?.data?.error || error.message));
      console.error("Notify error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubjectsTaught = (teacher) => {
    setSelectedTeacher(teacher);
    setEditSubjects(teacher?.subjectsTaught ? teacher.subjectsTaught.split(", ").map(item => {
      const [subject, section] = item.split(" (");
      return section ? `${subject} (${section.slice(0, -1)})` : item;
    }).filter(Boolean) : []);
    setOpenEditDialog(true);
  };

  const handleSaveEditedSubjects = async () => {
    if (!selectedTeacher) return;
    setLoading(true);
    try {
      const sectionsTaught = editSubjects.map(item => {
        const match = item.match(/\(([^)]+)\)/);
        return match ? match[1] : null;
      }).filter(Boolean);

      await axios.post(`${API_URL}/update_teacher_sections_taught`, {
        teacher_id: selectedTeacher.name || selectedTeacher,
        sections_taught: sectionsTaught,
      });
      setMessage("Subjects taught updated successfully!");
      const backendDate = parseDate(date);
      const response = await axios.get(`${API_URL}/generate?date=${backendDate}`, { timeout: 120000 });
      setTimetable(response.data.timetable || {});
      setEndDate(formatDate(new Date(response.data.end_date)));
      setDate(formatDate(new Date(response.data.date)));
      setRefreshTrigger((prev) => prev + 1);
      setOpenEditDialog(false);
      setSelectedTeacher(null);
      setEditSubjects([]);
    } catch (error) {
      setMessage("Error updating subjects taught: " + (error.response?.data?.detail || error.message));
      console.error("Update subjects error:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDrawer = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setDrawerOpen(open);
    console.log("Toggle Drawer Event:", event, "Open:", open);
  };

  return (
    <StyledContainer>
      <AppBar position="static" sx={{ backgroundColor: "#1e88e5", marginBottom: 2, borderRadius: "8px" }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, color: "#ffffff" }}>
            Admin Timetable Panel
          </Typography>
          <AppBarIconButton
            edge="end"
            color="inherit"
            aria-label="menu"
            onClick={toggleDrawer(true)}
            sx={{ ml: 2 }}
          >
            <MenuIcon />
          </AppBarIconButton>
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={toggleDrawer(false)}
        sx={{ "& .MuiDrawer-paper": { backgroundColor: "#f5f7fa", width: 240, borderRadius: "0 0 0 8px" } }}
      >
        <List sx={{ padding: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: "bold", color: "#2196f3", marginBottom: 2, textAlign: "center" }}>
            Menu
          </Typography>
          <ListItem button onClick={() => { navigate("/teacher-availability"); setDrawerOpen(false); }} sx={{ backgroundColor: "#e3f2fd", borderRadius: "4px", marginBottom: 1 }}>
            <ListItemText primary="Teacher Availability" sx={{ color: "#2196f3" }} />
          </ListItem>
          <ListItem button onClick={() => { navigate("/assign-sections"); setDrawerOpen(false); }} sx={{ backgroundColor: "#e3f2fd", borderRadius: "4px", marginBottom: 1 }}>
            <ListItemText primary="Assign Subjects and Sections" sx={{ color: "#2196f3" }} />
          </ListItem>
          <ListItem button onClick={() => { navigate("/unavailable-teachers"); setDrawerOpen(false); }} sx={{ backgroundColor: "#e3f2fd", borderRadius: "4px", marginBottom: 1 }}>
            <ListItemText primary="Show Unavailable Teachers" sx={{ color: "#2196f3" }} />
          </ListItem>
          <ListItem button onClick={() => { navigate("/lecture-limits"); setDrawerOpen(false); }} sx={{ backgroundColor: "#e3f2fd", borderRadius: "4px", marginBottom: 1 }}>
            <ListItemText primary="Assign Lecture Limits" sx={{ color: "#2196f3" }} />
          </ListItem>
        </List>
      </Drawer>

      <StyledCard>
        <CardContent>
          <Box sx={{ marginBottom: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <StyledTextField
                  fullWidth
                  label="Start Date (DD-MM-YYYY)"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} md={8}>
                <Box sx={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap" }}>
                  <StyledButton variant="contained" color="primary" onClick={fetchTimetable} disabled={loading}>
                    Fetch Timetable
                  </StyledButton>
                  <StyledButton variant="contained" color="secondary" onClick={generateTimetable} disabled={loading}>
                    Generate Timetable
                  </StyledButton>
                  <StyledButton variant="contained" color="success" onClick={sendNotifications} disabled={loading}>
                    Send Notifications
                  </StyledButton>
                  <StyledButton variant="outlined" color="error" onClick={() => setTimetable(null)} disabled={loading}>
                    Clear Timetable
                  </StyledButton>
                </Box>
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ marginY: 2 }} />

          {message && (
            <Alert
              severity={message.includes("Error") ? "error" : "success"}
              sx={{ marginBottom: 2, borderRadius: "8px" }}
            >
              {message}
            </Alert>
          )}

          {!timetable ? (
            <Typography
              variant="h6"
              sx={{ marginTop: 4, color: "#757575", textAlign: "center" }}
            >
              Please fetch or generate the timetable to view it.
            </Typography>
          ) : !Object.keys(timetable).length ? (
            <Typography
              variant="h6"
              sx={{ marginTop: 4, color: "#757575", textAlign: "center" }}
            >
              No timetable data available.
            </Typography>
          ) : (
            <Box sx={{ marginTop: 4 }}>
              <Typography
                variant="h4"
                gutterBottom
                sx={{ fontWeight: "bold", color: "#1e88e5", marginBottom: 2 }}
              >
                Timetable from {date} to {endDate}
              </Typography>
              {Object.entries(timetable).map(([section, days]) => (
                <StyledCard key={section} sx={{ marginBottom: 3 }}>
                  <CardContent>
                    <Typography
                      variant="h5"
                      gutterBottom
                      sx={{ fontWeight: "bold", color: "#2196f3" }}
                    >
                      Section {section}
                    </Typography>
                    {Object.entries(days).map(([day, slots]) => (
                      <Box key={day} sx={{ marginBottom: 2 }}>
                        <Typography
                          variant="h6"
                          gutterBottom
                          sx={{ fontWeight: "medium", color: "#424242" }}
                        >
                          {day}
                        </Typography>
                        <Table>
                          <TableHead>
                            <TableRow sx={{ backgroundColor: "#e3f2fd" }}>
                              <TableCell sx={{ fontWeight: "bold", color: "#2196f3" }}>Time Slot</TableCell>
                              <TableCell sx={{ fontWeight: "bold", color: "#2196f3" }}>Subject</TableCell>
                              <TableCell sx={{ fontWeight: "bold", color: "#2196f3" }}>Teacher</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {Object.entries(slots).map(([slot, info]) => (
                              <TableRow key={slot} sx={{ "&:nth-of-type(odd)": { backgroundColor: "#f5f5f5" } }}>
                                <TableCell>{slot}</TableCell>
                                <TableCell>{info.subject}</TableCell>
                                <TableCell>{info.teacher || "N/A"}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </Box>
                    ))}
                  </CardContent>
                </StyledCard>
              ))}
            </Box>
          )}

          <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)}>
            <DialogTitle sx={{ backgroundColor: "#e3f2fd", color: "#2196f3" }}>
              Edit Subjects Taught for {selectedTeacher?.name || selectedTeacher || "Unknown Teacher"}
            </DialogTitle>
            <DialogContent>
              <FormControl fullWidth sx={{ marginTop: 2 }}>
                <InputLabel>Subjects Taught (Section)</InputLabel>
                <Select
                  multiple
                  value={editSubjects}
                  onChange={(e) => setEditSubjects(e.target.value)}
                  renderValue={(selected) => selected.join(", ")}
                  label="Subjects Taught (Section)"
                  MenuProps={{ PaperProps: { style: { maxHeight: 300 } }}}
                >
                  {SECTIONS.flatMap((section) =>
                    SUBJECTS.map((subject) => (
                      <MenuItem key={`${subject} (${section})`} value={`${subject} (${section})`}>
                        <Chip label={`${subject} (${section})`} size="small" />
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenEditDialog(false)} color="error">
                Cancel
              </Button>
              <Button onClick={handleSaveEditedSubjects} color="primary">
                Save
              </Button>
            </DialogActions>
          </Dialog>
        </CardContent>
      </StyledCard>
    </StyledContainer>
  );
}

export default AdminDashboard;
