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
  Chip,
  IconButton,
  Tooltip,
  Divider,
} from "@mui/material";
import { styled } from "@mui/system";
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import SchoolIcon from '@mui/icons-material/School';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PrintIcon from '@mui/icons-material/Print';
import DownloadIcon from '@mui/icons-material/Download';
import RefreshIcon from '@mui/icons-material/Refresh';

const API_URL = "http://localhost:8000";
const SECTIONS = ["A", "B", "C", "D", "E", "F", "G", "H", "ARQ", "DS1", "DS2", "ML1", "ML2", "Cyber", "AI"];

const StyledContainer = styled(Container)(({ theme }) => ({
  padding: theme.spacing(3),
  backgroundColor: "#f8f9fa",
  minHeight: "100vh",
}));

const HeaderSection = styled(Box)(({ theme }) => ({
  backgroundColor: "#fff",
  padding: theme.spacing(3),
  borderRadius: "8px",
  boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
  marginBottom: theme.spacing(3),
}));

const ControlsCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  borderRadius: "8px",
  boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
  border: "1px solid #e0e0e0",
}));

const TimetableContainer = styled(Paper)(({ theme }) => ({
  borderRadius: "8px",
  overflow: "hidden",
  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  border: "1px solid #e0e0e0",
  backgroundColor: "#ffffff",
}));

const StyledTable = styled(Table)(({ theme }) => ({
  minWidth: 1000,
  "& .MuiTableCell-root": {
    borderColor: "#e0e0e0",
  },
}));

const TimeCell = styled(TableCell)(({ theme }) => ({
  backgroundColor: "#f8f9fa",
  fontWeight: 600,
  color: "#2c3e50",
  borderRight: "2px solid #e0e0e0",
  padding: "12px 16px",
  textAlign: "center",
  minWidth: "120px",
  fontSize: "0.875rem",
}));

const DayHeaderCell = styled(TableCell)(({ theme }) => ({
  backgroundColor: "#2c3e50",
  color: "#ffffff",
  fontWeight: 600,
  textAlign: "center",
  padding: "16px",
  fontSize: "0.95rem",
  borderBottom: "2px solid #2c3e50",
}));

const ClassCell = styled(TableCell)(({ theme }) => ({
  padding: "8px",
  textAlign: "center",
  verticalAlign: "middle",
  backgroundColor: "#ffffff",
  borderRight: "1px solid #e0e0e0",
  borderBottom: "1px solid #e0e0e0",
  height: "80px",
}));

const SubjectBox = styled(Box)(({ theme, bgColor }) => ({
  backgroundColor: bgColor || "#f0f0f0",
  padding: "8px 12px",
  borderRadius: "6px",
  height: "100%",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  transition: "transform 0.2s ease",
  cursor: "pointer",
  "&:hover": {
    transform: "scale(1.02)",
    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
  },
}));

const SubjectCode = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  fontSize: "0.95rem",
  color: "#2c3e50",
  marginBottom: "4px",
}));

const TeacherName = styled(Typography)(({ theme }) => ({
  fontSize: "0.75rem",
  color: "#546e7a",
  fontStyle: "italic",
}));

const EmptySlot = styled(Typography)(({ theme }) => ({
  color: "#bdbdbd",
  fontSize: "1.5rem",
  fontWeight: 300,
}));

const LunchBox = styled(Box)(({ theme }) => ({
  backgroundColor: "#fff3cd",
  border: "1px solid #ffeaa7",
  padding: "12px",
  borderRadius: "6px",
  color: "#856404",
  fontWeight: 600,
  fontSize: "0.9rem",
}));

// Professional color scheme for subjects
const subjectColors = {
  "TCS-408": "#e3f2fd",  // Light Blue
  "TCS-402": "#f3e5f5",  // Light Purple
  "TCS-403": "#e8f5e9",  // Light Green
  "TCS-409": "#fff3e0",  // Light Orange
  "XCS-401": "#fce4ec",  // Light Pink
  "TOC-401": "#e0f2f1",  // Light Teal
  "PCS-408": "#f1f8e9",  // Light Lime
  "PCS-403": "#e8eaf6",  // Light Indigo
  "PCS-409": "#fff8e1",  // Light Amber
  "DP900": "#efebe9",   // Light Brown
  "AI900": "#fafafa",   // Light Grey
  "NDE": "#eceff1",     // Blue Grey
  "Elective": "#e1f5fe", // Light Cyan
};

function StudentDashboard() {
  const today = new Date();
  const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };
  
  const [date, setDate] = useState(formatDate(today));
  const [section, setSection] = useState("");
  const [timetable, setTimetable] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showTeachers, setShowTeachers] = useState(false);
  const [availableTeachers, setAvailableTeachers] = useState([]);
  const [weekDates, setWeekDates] = useState({});

  const parseDate = (dateStr) => {
    const [day, month, year] = dateStr.split("-");
    return `${year}-${month}-${day}`;
  };

  const calculateWeekDates = (startDateStr) => {
    const [day, month, year] = startDateStr.split("-");
    const startDate = new Date(year, month - 1, day);
    const dates = {};
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    
    let currentDate = new Date(startDate);
    let dayIndex = 0;
    
    while (dayIndex < 6) {
      if (currentDate.getDay() !== 0) {
        const dateStr = `${String(currentDate.getDate()).padStart(2, "0")}/${String(currentDate.getMonth() + 1).padStart(2, "0")}`;
        dates[days[dayIndex]] = dateStr;
        dayIndex++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dates;
  };

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
        setWeekDates(calculateWeekDates(date));
        setMessage("");
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
      const [availabilityResponse, sectionsResponse] = await Promise.all([
        axios.get(`${API_URL}/teacher_availability`),
        axios.get(`${API_URL}/teacher_sections_taught`),
      ]);
      const availability = availabilityResponse.data;
      const sectionsTaught = sectionsResponse.data;

      const teachersForSection = Object.entries(availability)
        .filter(([teacher, isAvailable]) => {
          const teaches = sectionsTaught[teacher] || [];
          return isAvailable && teaches.includes(section);
        })
        .map(([teacher]) => ({
          name: teacher,
          sectionsTaught: (sectionsTaught[teacher] || []).join(", "),
        }));

      setAvailableTeachers(teachersForSection);
      setShowTeachers(true);
    } catch (error) {
      setMessage("Failed to fetch teacher data: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const timeSlots = [
    "8:00-9:00",
    "9:00-10:00",
    "10:00-11:00",
    "11:00-12:00",
    "12:00-13:00",
    "13:00-14:00",
    "14:00-15:00",
    "15:00-16:00",
  ];

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  const getActiveTimeSlots = () => {
    if (!timetable || !Object.keys(timetable).length) return timeSlots.slice(0, 5);
    
    const slotsWithContent = new Set();
    
    ["8:00-9:00", "9:00-10:00", "10:00-11:00", "11:00-12:00", "12:00-13:00"].forEach(slot => {
      slotsWithContent.add(slot);
    });
    
    let hasAfternoonClasses = false;
    days.forEach(day => {
      if (timetable[day]) {
        ["14:00-15:00", "15:00-16:00"].forEach(slot => {
          if (timetable[day][slot] && timetable[day][slot].subject !== "Lunch") {
            hasAfternoonClasses = true;
            slotsWithContent.add(slot);
          }
        });
      }
    });
    
    if (hasAfternoonClasses) {
      slotsWithContent.add("13:00-14:00");
      slotsWithContent.add("14:00-15:00");
      slotsWithContent.add("15:00-16:00");
    }
    
    return timeSlots.filter(slot => slotsWithContent.has(slot));
  };

  const displayTimeSlots = getActiveTimeSlots();

  const getSlotContent = (day, timeSlot) => {
    if (!timetable || !timetable[day] || !timetable[day][timeSlot]) {
      return null;
    }
    return timetable[day][timeSlot];
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <StyledContainer maxWidth="xl">
      <HeaderSection>
        <Grid container alignItems="center" justifyContent="space-between">
          <Grid item>
            <Typography variant="h4" sx={{ fontWeight: 600, color: "#2c3e50", display: "flex", alignItems: "center", gap: 1 }}>
              <SchoolIcon sx={{ fontSize: 32 }} />
              Student Timetable System
            </Typography>
            <Typography variant="body2" sx={{ color: "#7f8c8d", mt: 0.5 }}>
              View and manage your weekly class schedule
            </Typography>
          </Grid>
          <Grid item>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Tooltip title="Print Timetable">
                <IconButton onClick={handlePrint} sx={{ border: "1px solid #e0e0e0" }}>
                  <PrintIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Download">
                <IconButton sx={{ border: "1px solid #e0e0e0" }}>
                  <DownloadIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Grid>
        </Grid>
      </HeaderSection>

      <ControlsCard>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Week Starting Date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                variant="outlined"
                size="small"
                InputProps={{
                  startAdornment: <CalendarTodayIcon sx={{ mr: 1, color: "#7f8c8d", fontSize: 20 }} />,
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Section</InputLabel>
                <Select
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  label="Section"
                >
                  <MenuItem value=""><em>Select Section</em></MenuItem>
                  {SECTIONS.map((sec) => (
                    <MenuItem key={sec} value={sec}>Section {sec}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                variant="contained"
                onClick={fetchTimetable}
                disabled={loading}
                fullWidth
                sx={{
                  backgroundColor: "#2c3e50",
                  "&:hover": { backgroundColor: "#34495e" },
                  textTransform: "none",
                  fontWeight: 600,
                }}
                startIcon={<RefreshIcon />}
              >
                {loading ? "Loading..." : "Load Timetable"}
              </Button>
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                variant="outlined"
                onClick={toggleAvailableTeachers}
                disabled={loading}
                fullWidth
                sx={{
                  borderColor: "#2c3e50",
                  color: "#2c3e50",
                  textTransform: "none",
                  fontWeight: 600,
                  "&:hover": {
                    borderColor: "#34495e",
                    backgroundColor: "rgba(44, 62, 80, 0.04)",
                  }
                }}
                startIcon={<PersonOutlineIcon />}
              >
                {showTeachers ? "Hide Teachers" : "View Teachers"}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </ControlsCard>

      {message && (
        <Alert 
          severity={message.includes("Error") ? "error" : "info"} 
          sx={{ mb: 2, borderRadius: "8px" }}
          onClose={() => setMessage("")}
        >
          {message}
        </Alert>
      )}

      {!timetable ? (
        <Paper sx={{ p: 8, textAlign: "center", borderRadius: "8px" }}>
          <CalendarTodayIcon sx={{ fontSize: 64, color: "#e0e0e0", mb: 2 }} />
          <Typography variant="h6" sx={{ color: "#7f8c8d" }}>
            Select a section and date to view the timetable
          </Typography>
        </Paper>
      ) : !Object.keys(timetable).length ? (
        <Paper sx={{ p: 8, textAlign: "center", borderRadius: "8px" }}>
          <Typography variant="h6" sx={{ color: "#7f8c8d" }}>
            No timetable data available for this section
          </Typography>
        </Paper>
      ) : (
        <>
          <TimetableContainer>
            <Box sx={{ p: 2, backgroundColor: "#2c3e50", color: "#fff" }}>
              <Typography variant="h5" sx={{ fontWeight: 600, textAlign: "center" }}>
                Section {section} - Weekly Timetable
              </Typography>
              <Typography variant="body2" sx={{ textAlign: "center", opacity: 0.8, mt: 0.5 }}>
                Week starting from {date}
              </Typography>
            </Box>
            
            <StyledTable>
              <TableHead>
                <TableRow>
                  <TimeCell>
                    <AccessTimeIcon sx={{ fontSize: 18, mb: 0.5 }} />
                    <br />
                    TIME
                  </TimeCell>
                  {days.map((day) => (
                    <DayHeaderCell key={day}>
                      <Typography sx={{ fontWeight: 600 }}>{day.toUpperCase()}</Typography>
                      {weekDates[day] && (
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>
                          {weekDates[day]}
                        </Typography>
                      )}
                    </DayHeaderCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {displayTimeSlots.map((timeSlot) => {
                  const isLunchSlot = timeSlot === "13:00-14:00";
                  
                  return (
                    <TableRow key={timeSlot}>
                      <TimeCell>{timeSlot}</TimeCell>
                      {days.map((day) => {
                        const slotContent = getSlotContent(day, timeSlot);
                        
                        if (isLunchSlot && slotContent) {
                          return (
                            <ClassCell key={`${day}-${timeSlot}`}>
                              <LunchBox>LUNCH BREAK</LunchBox>
                            </ClassCell>
                          );
                        }
                        
                        return (
                          <ClassCell key={`${day}-${timeSlot}`}>
                            {slotContent && slotContent.subject !== "Lunch" ? (
                              <SubjectBox bgColor={subjectColors[slotContent.subject]}>
                                <SubjectCode>{slotContent.subject}</SubjectCode>
                                <TeacherName>
                                  {slotContent.teacher === "respective teacher" 
                                    ? "Elective Faculty" 
                                    : slotContent.teacher || "TBA"}
                                </TeacherName>
                              </SubjectBox>
                            ) : (
                              <EmptySlot>–</EmptySlot>
                            )}
                          </ClassCell>
                        );
                      })}
                    </TableRow>
                  );
                })}
              </TableBody>
            </StyledTable>

            <Box sx={{ p: 2, backgroundColor: "#f8f9fa", borderTop: "1px solid #e0e0e0" }}>
              <Grid container spacing={1}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: "#2c3e50" }}>
                    Subject Codes:
                  </Typography>
                </Grid>
                {Object.entries(subjectColors).filter(([subject]) => subject !== "Lunch").map(([subject, color]) => (
                  <Grid item key={subject}>
                    <Chip
                      label={subject}
                      size="small"
                      sx={{
                        backgroundColor: color,
                        color: "#2c3e50",
                        fontWeight: 600,
                        fontSize: "0.75rem",
                        border: "1px solid #e0e0e0",
                      }}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          </TimetableContainer>

          {showTeachers && availableTeachers.length > 0 && (
            <Card sx={{ mt: 3, borderRadius: "8px", border: "1px solid #e0e0e0" }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: "#2c3e50", fontWeight: 600 }}>
                  Available Teachers for Section {section}
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, color: "#2c3e50" }}>Teacher Name</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: "#2c3e50" }}>Sections Taught</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {availableTeachers.map((teacher) => (
                      <TableRow key={teacher.name}>
                        <TableCell>{teacher.name}</TableCell>
                        <TableCell>{teacher.sectionsTaught}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </StyledContainer>
  );
}

export default StudentDashboard;
