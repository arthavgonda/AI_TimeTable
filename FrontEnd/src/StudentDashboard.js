import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Container,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Grid,
  Card,
  CardContent,
} from "@mui/material";
import { styled } from "@mui/system";

const API_URL = "http://localhost:8000";
const SECTIONS = ["A", "B", "C", "D", "E", "F", "G", "H", "ARQ", "DS1", "DS2", "ML1", "ML2", "Cyber", "AI"];

const StyledContainer = styled(Container)(({ theme }) => ({
  padding: theme.spacing(4),
  backgroundColor: "#f5f7fa",
  minHeight: "100vh",
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

const StyledSelect = styled(Select)(({ theme }) => ({
  margin: theme.spacing(1),
  borderRadius: "8px",
  backgroundColor: "#f9f9f9",
}));

function StudentDashboard() {
  const today = new Date();
  const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };
  const backendFormatDate = (dateStr) => {
    const [day, month, year] = dateStr.split("-");
    return `${year}-${month}-${day}`;
  };
  const [date, setDate] = useState(formatDate(today));
  const [section, setSection] = useState("");
  const [timetable, setTimetable] = useState(null);
  const [availableTeachers, setAvailableTeachers] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showTeachers, setShowTeachers] = useState(false);
  const [teacherSectionAssignments, setTeacherSectionAssignments] = useState({});
  const [teacherSectionsTaught, setTeacherSectionsTaught] = useState({});

  const parseDate = (dateStr) => {
    const [day, month, year] = dateStr.split("-");
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const [assignmentsResponse, taughtResponse] = await Promise.all([
          axios.get(`${API_URL}/teacher_section_assignments`),
          axios.get(`${API_URL}/teacher_sections_taught`),
        ]);
        setTeacherSectionAssignments(assignmentsResponse.data);
        setTeacherSectionsTaught(taughtResponse.data);
      } catch (error) {
        console.error("Error fetching teacher data:", error);
      }
    };
    fetchAssignments();
  }, []);

  const fetchTimetable = async () => {
    if (!section) {
      setMessage("Please select a section.");
      return;
    }
    setLoading(true);
    setMessage("");
    const backendDate = parseDate(date);
    try {
      const response = await axios.get(`${API_URL}/timetable/${backendDate}`, { timeout: 60000 });
      if (response.data.error) {
        setMessage(response.data.error);
        setTimetable(null);
      } else {
        const fullTimetable = response.data.timetable || {};
        setTimetable(fullTimetable[section] || {});
        setMessage(`Timetable fetched successfully for ${section} on ${date}`);
      }
    } catch (error) {
      setMessage("Error fetching timetable: " + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const toggleAvailableTeachers = async () => {
    if (showTeachers) {
      setAvailableTeachers([]);
      setShowTeachers(false);
      return;
    }
    setLoading(true);
    try {
      const [availabilityResponse, timetableResponse] = await Promise.all([
        axios.get(`${API_URL}/teacher_availability`),
        axios.get(`${API_URL}/timetable/${parseDate(date)}`, { timeout: 60000 }),
      ]);
      const availability = availabilityResponse.data;
      const currentTimetable = timetableResponse.data.timetable || {};

      const teacherStats = {};
      if (currentTimetable[section]) {
        Object.values(currentTimetable[section]).forEach((slots) => {
          Object.values(slots).forEach((slot) => {
            const teacher = slot.teacher !== "respective teacher" ? slot.teacher : null;
            if (teacher) {
              if (!teacherStats[teacher]) {
                teacherStats[teacher] = { lectures: 0, sections: new Set() };
              }
              teacherStats[teacher].lectures += 1;
              teacherStats[teacher].sections.add(section);
            }
          });
        });
      }

      const sectionsTaughtForSection = new Set();
      Object.entries(teacherSectionsTaught).forEach(([teacher, taughtSections]) => {
        if (taughtSections.includes(section)) {
          if (!teacherStats[teacher]) {
            teacherStats[teacher] = { lectures: 0, sections: new Set() };
          }
          teacherStats[teacher].sections.add(section);
          sectionsTaughtForSection.add(teacher);
        }
      });

      const availableTeachers = Object.entries(availability)
        .filter(([teacher, isAvailable]) => isAvailable && (teacherStats[teacher]?.sections?.has(section) || sectionsTaughtForSection.has(teacher)))
        .map(([teacher]) => {
          const stats = teacherStats[teacher] || { lectures: 0, sections: new Set() };
          const assignedSections = teacherSectionAssignments[teacher] || [];
          return {
            name: teacher,
            lectures: stats.lectures,
            sectionsTaught: Array.from(stats.sections).join(", ") || (teacherSectionsTaught[teacher]?.join(", ") || ""),
            assignedSections: assignedSections.length > 0 ? assignedSections.join(", ") : "None",
          };
        });

      setAvailableTeachers(availableTeachers);
      setShowTeachers(true);
    } catch (error) {
      setMessage("Failed to fetch teacher data: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <StyledContainer>
      <Typography
        variant="h3"
        gutterBottom
        align="center"
        sx={{ fontWeight: "bold", color: "#1e88e5", marginBottom: 4 }}
      >
        Student Timetable
      </Typography>

      <StyledCard>
        <CardContent>
          <Box sx={{ marginBottom: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <StyledTextField
                  fullWidth
                  label="Date (DD-MM-YYYY)"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Section</InputLabel>
                  <StyledSelect
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    label="Section"
                  >
                    <MenuItem value=""><em>Select Section</em></MenuItem>
                    {SECTIONS.map((sec) => (
                      <MenuItem key={sec} value={sec}>{sec}</MenuItem>
                    ))}
                  </StyledSelect>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <StyledButton
                  variant="contained"
                  color="primary"
                  onClick={fetchTimetable}
                  disabled={loading}
                >
                  {loading ? "Fetching..." : "View Timetable"}
                </StyledButton>
              </Grid>
            </Grid>
          </Box>

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
              Please select a date and section to view the timetable.
            </Typography>
          ) : !Object.keys(timetable).length ? (
            <Typography
              variant="h6"
              sx={{ marginTop: 4, color: "#757575", textAlign: "center" }}
            >
              No timetable data available for this date and section.
            </Typography>
          ) : (
            <Box sx={{ marginTop: 4 }}>
              <Typography
                variant="h4"
                gutterBottom
                sx={{ fontWeight: "bold", color: "#1e88e5", marginBottom: 2 }}
              >
                Timetable for {section} on {date}
              </Typography>
              <StyledCard>
                <CardContent>
                  {Object.entries(timetable).map(([day, slots]) => (
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
            </Box>
          )}

          <StyledCard sx={{ marginTop: 4 }}>
            <CardContent>
              <Typography
                variant="h5"
                gutterBottom
                sx={{ fontWeight: "bold", color: "#1e88e5", marginBottom: 2 }}
              >
                Teacher Availability
              </Typography>
              <StyledButton
                variant="contained"
                color="info"
                onClick={toggleAvailableTeachers}
                disabled={loading}
                sx={{ marginBottom: 2 }}
              >
                {showTeachers ? "Hide Available Teachers" : "Show Available Teachers"}
              </StyledButton>
              {showTeachers && availableTeachers.length > 0 && (
                <Box sx={{ marginTop: 2 }}>
                  <Table sx={{ backgroundColor: "#f9f9f9", borderRadius: "8px" }}>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: "#e3f2fd" }}>
                        <TableCell sx={{ fontWeight: "bold", color: "#2196f3", padding: 1.5 }}>Teacher</TableCell>
                        <TableCell sx={{ fontWeight: "bold", color: "#2196f3", padding: 1.5 }}>Lectures</TableCell>
                        <TableCell sx={{ fontWeight: "bold", color: "#2196f3", padding: 1.5 }}>Sections Taught</TableCell>
                        <TableCell sx={{ fontWeight: "bold", color: "#2196f3", padding: 1.5 }}>Assigned Sections</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {availableTeachers.map((teacher, index) => (
                        <TableRow
                          key={teacher.name}
                          sx={{ "&:nth-of-type(odd)": { backgroundColor: "#f5f5f5" }, padding: 1 }}
                        >
                          <TableCell sx={{ padding: 1 }}>{teacher.name}</TableCell>
                          <TableCell sx={{ padding: 1 }}>{teacher.lectures}</TableCell>
                          <TableCell sx={{ padding: 1 }}>{teacher.sectionsTaught}</TableCell>
                          <TableCell sx={{ padding: 1 }}>{teacher.assignedSections}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              )}
            </CardContent>
          </StyledCard>
        </CardContent>
      </StyledCard>
    </StyledContainer>
  );
}

export default StudentDashboard;
