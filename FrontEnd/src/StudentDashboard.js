import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
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
import {
  CalendarToday,
  School,
  PersonOutline,
  LocationOn,
  Print,
  Download,
  Refresh,
} from "@mui/icons-material";

const API_URL = "http://localhost:8000";

// Minimal styled components
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

const TimetableContainer = styled(Paper)(({ theme }) => ({
  overflow: "hidden",
  marginTop: theme.spacing(3),
}));

const StyledTable = styled(Table)(({ theme }) => ({
  minWidth: 1000,
}));

const TimeCell = styled(TableCell)(({ theme }) => ({
  backgroundColor: "#f5f5f5",
  fontWeight: 600,
  color: theme.palette.text.primary,
  borderRight: "1px solid #e0e0e0",
  padding: "12px 16px",
  textAlign: "center",
  minWidth: "120px",
}));

const DayHeaderCell = styled(TableCell)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  fontWeight: 600,
  textAlign: "center",
  padding: "16px",
}));

const ClassCell = styled(TableCell)(({ theme }) => ({
  padding: "8px",
  textAlign: "center",
  verticalAlign: "middle",
  height: "80px",
  border: "1px solid #e0e0e0",
}));

const SubjectBox = styled(Box)(({ theme, bgColor }) => ({
  backgroundColor: bgColor || "#f0f0f0",
  padding: "8px 12px",
  borderRadius: "4px",
  height: "100%",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
}));

const SubjectCode = styled(Typography)({
  fontWeight: 600,
  fontSize: "0.9rem",
  marginBottom: "4px",
});

const TeacherName = styled(Typography)({
  fontSize: "0.75rem",
  color: "#666",
  fontStyle: "italic",
});

const RoomNumber = styled(Typography)(({ theme }) => ({
  fontSize: "0.7rem",
  color: theme.palette.primary.main,
  fontWeight: 600,
  marginTop: "2px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "4px",
}));

const EmptySlot = styled(Typography)({
  color: "#bbb",
  fontSize: "1.5rem",
  fontWeight: 300,
});

const LunchBox = styled(Box)({
  backgroundColor: "#fff3cd",
  padding: "12px",
  borderRadius: "4px",
  color: "#856404",
  fontWeight: 600,
});

// Subject colors - clean and minimal
const subjectColors = {
  "TCS-408": "#e3f2fd",
  "TCS-402": "#f3e5f5",
  "TCS-403": "#e8f5e9",
  "TCS-409": "#fff3e0",
  "XCS-401": "#fce4ec",
  "TOC-401": "#e0f2f1",
  "PCS-408": "#f1f8e9",
  "PCS-403": "#e8eaf6",
  "PCS-409": "#fff8e1",
  "DP900": "#efebe9",
  "AI900": "#fafafa",
  "NDE": "#eceff1",
  "Elective": "#e1f5fe",
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
  const [course, setCourse] = useState("BTech");
  const [semester, setSemester] = useState(4);
  const [section, setSection] = useState("");
  const [courses, setCourses] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [sections, setSections] = useState([]);
  const [timetable, setTimetable] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showTeachers, setShowTeachers] = useState(false);
  const [availableTeachers, setAvailableTeachers] = useState([]);
  const [weekDates, setWeekDates] = useState({});
  const timetableRef = useRef(null);

  // Load courses on component mount
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

  // Load semesters when course changes
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

  // Load sections when course changes
  useEffect(() => {
    if (course) {
      const loadSections = async () => {
        try {
          const response = await axios.get(`${API_URL}/sections/${course}`);
          setSections(response.data.sections || []);
          setSection(""); // Reset section when course changes
        } catch (error) {
          console.error("Error loading sections:", error);
        }
      };
      loadSections();
    }
  }, [course]);

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
    "8:00-9:00", "9:00-10:00", "10:00-11:00", "11:00-12:00",
    "12:00-13:00", "13:00-14:00", "14:00-15:00", "15:00-16:00"
  ];

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  const getSlotContent = (day, timeSlot) => {
    if (!timetable || !timetable[day]) return null;
    return timetable[day][timeSlot];
  };

  const handlePrint = () => {
    window.print();
  };

  const downloadPDF = async () => {
    if (!timetableRef.current) {
      setMessage("Error: Timetable not found");
      return;
    }

    setLoading(true);
    setMessage("Generating PDF...");

    try {
      const element = timetableRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`Timetable_Section_${section}_${date}.pdf`);
      
      setMessage("PDF downloaded successfully!");
    } catch (error) {
      setMessage("Error generating PDF: " + error.message);
      console.error("PDF generation error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <StyledContainer maxWidth="xl">
      {/* Header */}
      <Header elevation={1}>
        <Grid container alignItems="center" justifyContent="space-between">
          <Grid item>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <School sx={{ fontSize: 32 }} />
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  Student Dashboard
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  View your timetable and download PDFs
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Tooltip title="Print">
                <IconButton onClick={handlePrint} sx={{ color: "inherit" }}>
                  <Print />
                </IconButton>
              </Tooltip>
              <Tooltip title="Download PDF">
                <IconButton 
                  onClick={downloadPDF} 
                  disabled={!timetable || loading}
                  sx={{ color: "inherit" }}
                >
                  <Download />
                </IconButton>
              </Tooltip>
            </Box>
          </Grid>
        </Grid>
      </Header>

      {/* Controls */}
      <Card>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={2}>
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
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Semester</InputLabel>
                <Select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  label="Semester"
                >
                  {semesters.map((sem) => (
                    <MenuItem key={sem} value={sem}>Sem {sem}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Section</InputLabel>
                <Select
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  label="Section"
                >
                  <MenuItem value=""><em>Select</em></MenuItem>
                  {sections.map((sec) => (
                    <MenuItem key={sec} value={sec}>Sec {sec}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="Start Date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                variant="outlined"
                size="small"
                InputProps={{
                  startAdornment: <CalendarToday sx={{ mr: 1, fontSize: 20, color: "#666" }} />,
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                variant="contained"
                onClick={fetchTimetable}
                disabled={loading || !section}
                fullWidth
                startIcon={<Refresh />}
              >
                {loading ? "Loading..." : "Load"}
              </Button>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                variant="outlined"
                onClick={toggleAvailableTeachers}
                disabled={loading}
                fullWidth
                startIcon={<PersonOutline />}
              >
                {showTeachers ? "Hide" : "Teachers"}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {message && (
        <Alert 
          severity={message.includes("Error") ? "error" : "info"} 
          sx={{ mt: 2 }}
          onClose={() => setMessage("")}
        >
          {message}
        </Alert>
      )}

      {!timetable ? (
        <Paper sx={{ p: 8, textAlign: "center", mt: 3 }}>
          <Typography variant="h6" color="text.secondary">
            Select a section and date to view the timetable
          </Typography>
        </Paper>
      ) : !Object.keys(timetable).length ? (
        <Paper sx={{ p: 8, textAlign: "center", mt: 3 }}>
          <Typography variant="h6" color="text.secondary">
            No timetable data available for this section
          </Typography>
        </Paper>
      ) : (
        <>
          <TimetableContainer ref={timetableRef}>
            <Box sx={{ p: 2, backgroundColor: "primary.main", color: "primary.contrastText" }}>
              <Typography variant="h6" sx={{ fontWeight: 600, textAlign: "center" }}>
                {course} - Semester {semester} - Section {section}
              </Typography>
              <Typography variant="body2" sx={{ textAlign: "center", opacity: 0.9 }}>
                Week starting from {date}
              </Typography>
            </Box>
            
            <StyledTable>
              <TableHead>
                <TableRow>
                  <TimeCell>Time</TimeCell>
                  {days.map((day) => (
                    <DayHeaderCell key={day}>
                      {day}
                      {weekDates[day] && (
                        <Typography variant="caption" sx={{ display: "block", opacity: 0.8, mt: 0.5 }}>
                          {weekDates[day]}
                        </Typography>
                      )}
                    </DayHeaderCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {timeSlots.map((timeSlot) => {
                  const hasContent = days.some(day => {
                    const content = getSlotContent(day, timeSlot);
                    return content && content.subject !== "Lunch";
                  });

                  if (!hasContent && (timeSlot === "13:00-14:00" || timeSlot === "14:00-15:00" || timeSlot === "15:00-16:00")) {
                    return null;
                  }

                  return (
                    <TableRow key={timeSlot}>
                      <TimeCell>{timeSlot}</TimeCell>
                      {days.map((day) => {
                        const slotContent = getSlotContent(day, timeSlot);
                        return (
                          <ClassCell key={day}>
                            {slotContent ? (
                              slotContent.subject === "Lunch" ? (
                                <LunchBox>🍽️ Lunch Break</LunchBox>
                              ) : (
                                <SubjectBox bgColor={subjectColors[slotContent.subject] || "#f0f0f0"}>
                                  <SubjectCode>{slotContent.subject}</SubjectCode>
                                  <TeacherName>{slotContent.teacher}</TeacherName>
                                  {slotContent.room && (
                                    <RoomNumber>
                                      <LocationOn sx={{ fontSize: 12 }} />
                                      {slotContent.room}
                                    </RoomNumber>
                                  )}
                                </SubjectBox>
                              )
                            ) : (
                              <EmptySlot>—</EmptySlot>
                            )}
                          </ClassCell>
                        );
                      })}
                    </TableRow>
                  );
                })}
              </TableBody>
            </StyledTable>

            <Box sx={{ p: 2, backgroundColor: "#fafafa", borderTop: "1px solid #e0e0e0" }}>
              <Grid container spacing={1}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
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
                        fontWeight: 600,
                        fontSize: "0.75rem",
                      }}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          </TimetableContainer>

          {showTeachers && availableTeachers.length > 0 && (
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Available Teachers for Section {section}
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Teacher Name</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Sections Taught</TableCell>
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
