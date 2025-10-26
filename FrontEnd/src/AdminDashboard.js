import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
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
  Tooltip,
  ListItemIcon,
  Collapse,
  ListItemButton,
  Badge,
} from "@mui/material";
import { styled } from "@mui/system";
import EditIcon from "@mui/icons-material/Edit";
import MenuIcon from "@mui/icons-material/Menu";
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import SchoolIcon from '@mui/icons-material/School';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import RefreshIcon from '@mui/icons-material/Refresh';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import NotificationsIcon from '@mui/icons-material/Notifications';
import ClearIcon from '@mui/icons-material/Clear';
import DownloadIcon from '@mui/icons-material/Download';
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';
import PersonIcon from '@mui/icons-material/Person';
import AssignmentIcon from '@mui/icons-material/Assignment';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import TimerIcon from '@mui/icons-material/Timer';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import BarChartIcon from '@mui/icons-material/BarChart';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import PeopleIcon from '@mui/icons-material/People';
import ClassIcon from '@mui/icons-material/Class';
import InsightsIcon from '@mui/icons-material/Insights';
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:8000";

const SECTIONS = ["A", "B", "C", "D", "E", "F", "G", "H", "ARQ", "DS1", "DS2", "ML1", "ML2", "Cyber", "AI"];
const SUBJECTS = [
  "TCS-408", "TCS-402", "TCS-403", "TCS-409", "XCS-401", "TOC-401",
  "Elective", "PCS-408", "PCS-403", "PCS-409", "DP900", "AI900", "NDE"
];

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

const StyledCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  borderRadius: "8px",
  boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
  border: "1px solid #e0e0e0",
  backgroundColor: "#ffffff",
}));

const StyledButton = styled(Button)(({ theme }) => ({
  textTransform: "none",
  fontWeight: 600,
  borderRadius: "6px",
  padding: "8px 16px",
  transition: "all 0.2s ease",
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: "6px",
    backgroundColor: "#ffffff",
    "& fieldset": {
      borderColor: "#e0e0e0",
    },
    "&:hover fieldset": {
      borderColor: "#2c3e50",
    },
    "&.Mui-focused fieldset": {
      borderColor: "#2c3e50",
      borderWidth: "2px",
    },
  },
}));

const StyledDrawer = styled(Drawer)(({ theme }) => ({
  "& .MuiDrawer-paper": {
    backgroundColor: "#1a252f",
    color: "#ffffff",
    width: 300,
    paddingTop: theme.spacing(2),
    boxShadow: "2px 0 8px rgba(0,0,0,0.15)",
  },
}));

const DrawerHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  borderBottom: "1px solid rgba(255,255,255,0.15)",
  marginBottom: theme.spacing(1),
  background: "linear-gradient(135deg, #2c3e50 0%, #34495e 100%)",
}));

const CategoryHeader = styled(ListItemButton)(({ theme }) => ({
  margin: theme.spacing(1, 1),
  borderRadius: "8px",
  padding: theme.spacing(1.5),
  fontWeight: 600,
  backgroundColor: "rgba(255,255,255,0.05)",
  "&:hover": {
    backgroundColor: "rgba(255,255,255,0.1)",
  },
}));

const StyledListItem = styled(ListItemButton)(({ theme }) => ({
  margin: theme.spacing(0.5, 1),
  marginLeft: theme.spacing(2),
  borderRadius: "6px",
  padding: theme.spacing(1, 2),
  transition: "all 0.2s ease",
  "&:hover": {
    backgroundColor: "rgba(255,255,255,0.08)",
    transform: "translateX(4px)",
  },
}));

const CategoryDivider = styled(Divider)(({ theme }) => ({
  margin: theme.spacing(1, 2),
  backgroundColor: "rgba(255,255,255,0.1)",
}));

// Timetable specific styles
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

const RoomNumber = styled(Typography)(({ theme }) => ({
  fontSize: "0.7rem",
  color: "#e74c3c",
  fontWeight: 600,
  marginTop: "2px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "4px",
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

function AdminDashboard() {
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
  const [courses, setCourses] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [availableSections, setAvailableSections] = useState([]);
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
  const [selectedSection, setSelectedSection] = useState("");
  const [weekDates, setWeekDates] = useState({});
  const navigate = useNavigate();
  
  // Collapsible menu state
  const [openTeachers, setOpenTeachers] = useState(false);
  const [openScheduling, setOpenScheduling] = useState(false);
  const [openClassrooms, setOpenClassrooms] = useState(false);
  const [openAnalytics, setOpenAnalytics] = useState(false);
  
  // Download dialog state
  const [openDownloadDialog, setOpenDownloadDialog] = useState(false);
  const [downloadType, setDownloadType] = useState("all"); // "all" or "specific"
  const [downloadCourse, setDownloadCourse] = useState("BTech");
  const [downloadSemester, setDownloadSemester] = useState(4);
  const [downloadSection, setDownloadSection] = useState("");
  const timetableRef = useRef(null);

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
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

  const parseDate = (dateStr) => {
    const [day, month, year] = dateStr.split("-");
    return `${year}-${month}-${day}`;
  };

  const calculateWeekDates = (startDateStr) => {
    const parts = startDateStr.split("-");
    let startDate;
    
    if (parts[0].length === 4) {
      startDate = new Date(parts[0], parts[1] - 1, parts[2]);
    } else {
      startDate = new Date(parts[2], parts[1] - 1, parts[0]);
    }
    
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

  const getActiveTimeSlotsForSection = (section) => {
    if (!timetable || !timetable[section]) return timeSlots.slice(0, 5);
    
    const slotsWithContent = new Set();
    
    ["8:00-9:00", "9:00-10:00", "10:00-11:00", "11:00-12:00", "12:00-13:00"].forEach(slot => {
      slotsWithContent.add(slot);
    });
    
    let hasAfternoonClasses = false;
    days.forEach(day => {
      if (timetable[section][day]) {
        ["14:00-15:00", "15:00-16:00"].forEach(slot => {
          if (timetable[section][day][slot] && timetable[section][day][slot].subject !== "Lunch") {
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

  // Load courses on mount
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
          setAvailableSections(response.data.sections || []);
        } catch (error) {
          console.error("Error loading sections:", error);
        }
      };
      loadSections();
    }
  }, [course]);

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
        setWeekDates(calculateWeekDates(timetableResponse.data.date));
        if (Object.keys(timetableResponse.data.timetable || {}).length > 0) {
          setSelectedSection(Object.keys(timetableResponse.data.timetable)[0]);
        }
        setTeacherAvailability(availabilityResponse.data);
        setMessage("");
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
      setWeekDates(calculateWeekDates(response.data.date));
      if (Object.keys(response.data.timetable || {}).length > 0) {
        setSelectedSection(Object.keys(response.data.timetable)[0]);
      }
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
    setMessage(`Generating timetable for ${course} Semester ${semester}...`);
    try {
      const backendDate = parseDate(date);
      const response = await axios.get(
        `${API_URL}/generate?date=${backendDate}&course=${course}&semester=${semester}`, 
        { timeout: 120000 }
      );
      
      if (response.data.error) {
        setMessage(`Error: ${response.data.error}`);
        return;
      }
      
      setTimetable(response.data.timetable || {});
      setEndDate(formatDate(new Date(response.data.end_date)));
      setDate(formatDate(new Date(response.data.date)));
      setWeekDates(calculateWeekDates(response.data.date));
      if (Object.keys(response.data.timetable || {}).length > 0) {
        setSelectedSection(Object.keys(response.data.timetable)[0]);
      }
      setMessage(`Timetable generated successfully for ${course} Semester ${semester}!`);
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

  const downloadSpecificTimetable = async (sectionToDownload) => {
    if (!timetable || !timetable[sectionToDownload]) {
      setMessage(`Error: No timetable data for section ${sectionToDownload}`);
      return;
    }

    try {
      setMessage(`Generating PDF for Section ${sectionToDownload}...`);
      
      // Create a temporary container for the specific section
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      document.body.appendChild(tempContainer);
      
      // Render the timetable for this section
      tempContainer.innerHTML = `
        <div style="padding: 20px; background: white;">
          <div style="padding: 20px; background: #2c3e50; color: white; text-align: center; margin-bottom: 10px;">
            <h2 style="margin: 0;">${course} - Semester ${semester} - Section ${sectionToDownload}</h2>
            <p style="margin: 5px 0 0 0;">${date} to ${endDate}</p>
          </div>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr>
                <th style="border: 1px solid #ddd; padding: 10px; background: #2c3e50; color: white;">Time</th>
                ${days.map(day => `<th style="border: 1px solid #ddd; padding: 10px; background: #2c3e50; color: white;">${day}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${getActiveTimeSlotsForSection(sectionToDownload).map(timeSlot => `
                <tr>
                  <td style="border: 1px solid #ddd; padding: 10px; background: #f5f5f5; font-weight: 600;">${timeSlot}</td>
                  ${days.map(day => {
                    const content = timetable[sectionToDownload]?.[day]?.[timeSlot];
                    if (!content) return '<td style="border: 1px solid #ddd; padding: 10px;">—</td>';
                    if (content.subject === "Lunch") {
                      return '<td style="border: 1px solid #ddd; padding: 10px; background: #fff3cd; text-align: center;">🍽️ Lunch</td>';
                    }
                    return `<td style="border: 1px solid #ddd; padding: 10px; text-align: center;">
                      <div style="font-weight: 600; margin-bottom: 4px;">${content.subject || ''}</div>
                      <div style="font-size: 0.85em; color: #666; font-style: italic;">${content.teacher || ''}</div>
                      ${content.room ? `<div style="font-size: 0.75em; color: #2c3e50; font-weight: 600;">📍 ${content.room}</div>` : ''}
                    </td>`;
                  }).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;

      const canvas = await html2canvas(tempContainer, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      document.body.removeChild(tempContainer);

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
      pdf.save(`Timetable_${course}_Sem${semester}_Section${sectionToDownload}_${date}.pdf`);
      
      setMessage(`✅ PDF downloaded for Section ${sectionToDownload}`);
    } catch (error) {
      setMessage("Error generating PDF: " + error.message);
      console.error("PDF error:", error);
    }
  };

  const downloadAllTimetables = async () => {
    if (!timetable || Object.keys(timetable).length === 0) {
      setMessage("Error: No timetable data available");
      return;
    }

    setMessage("Generating PDFs for all sections...");
    const sections = Object.keys(timetable);
    
    for (let i = 0; i < sections.length; i++) {
      await downloadSpecificTimetable(sections[i]);
      // Small delay between downloads
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setMessage(`✅ Downloaded ${sections.length} timetables successfully!`);
  };

  const handleDownload = async () => {
    if (downloadType === "all") {
      await downloadAllTimetables();
    } else {
      if (!downloadSection) {
        setMessage("Please select a section");
        return;
      }
      await downloadSpecificTimetable(downloadSection);
    }
    setOpenDownloadDialog(false);
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
  };

  // Organized menu structure
  const menuStructure = [
    {
      category: "Teachers",
      icon: <PeopleIcon />,
      open: openTeachers,
      setOpen: setOpenTeachers,
      items: [
        { text: "Manage Teachers", icon: <ManageAccountsIcon />, path: "/teacher-management", description: "Add, edit, or remove teachers" },
        { text: "Availability & Preferences", icon: <AccessTimeIcon />, path: "/teacher-preferences", description: "Set time windows and preferences" },
        { text: "Quick Availability Toggle", icon: <PersonIcon />, path: "/teacher-availability", description: "Mark teachers available/unavailable" },
        { text: "Lecture Limits", icon: <TimerIcon />, path: "/lecture-limits", description: "Set maximum lectures per teacher" },
      ]
    },
    {
      category: "Scheduling",
      icon: <ClassIcon />,
      open: openScheduling,
      setOpen: setOpenScheduling,
      items: [
        { text: "Assign Subjects & Sections", icon: <AssignmentIcon />, path: "/assign-sections", description: "Assign teachers to subjects and sections" },
        { text: "View Unavailable Teachers", icon: <VisibilityOffIcon />, path: "/unavailable-teachers", description: "See who's currently unavailable" },
      ]
    },
    {
      category: "Classrooms",
      icon: <MeetingRoomIcon />,
      open: openClassrooms,
      setOpen: setOpenClassrooms,
      items: [
        { text: "Manage Rooms", icon: <MeetingRoomIcon />, path: "/classroom-management", description: "Add, edit, or remove classrooms" },
        { text: "Room Conflicts & Utilization", icon: <LocationOnIcon />, path: "/room-conflicts", description: "View conflicts and usage statistics" },
      ]
    },
    {
      category: "Analytics & Reports",
      icon: <InsightsIcon />,
      open: openAnalytics,
      setOpen: setOpenAnalytics,
      items: [
        { text: "Teacher Workload", icon: <BarChartIcon />, path: "/teacher-load", description: "View teacher load distribution" },
      ]
    }
  ];

  return (
    <StyledContainer maxWidth="xl">
      <HeaderSection>
        <Grid container alignItems="center" justifyContent="space-between">
          <Grid item>
            <Typography variant="h4" sx={{ fontWeight: 600, color: "#2c3e50", display: "flex", alignItems: "center", gap: 1 }}>
              <DashboardIcon sx={{ fontSize: 32 }} />
              Admin Dashboard
            </Typography>
            <Typography variant="body2" sx={{ color: "#7f8c8d", mt: 0.5 }}>
              Manage timetables and teacher assignments
            </Typography>
          </Grid>
          <Grid item>
            <IconButton
              onClick={toggleDrawer(true)}
              sx={{ 
                backgroundColor: "#2c3e50", 
                color: "#fff",
                "&:hover": { backgroundColor: "#34495e" }
              }}
            >
              <MenuIcon />
            </IconButton>
          </Grid>
        </Grid>
      </HeaderSection>

      <StyledDrawer
        anchor="right"
        open={drawerOpen}
        onClose={toggleDrawer(false)}
      >
        <DrawerHeader>
          <Typography variant="h5" sx={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 1 }}>
            <DashboardIcon />
            Admin Panel
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.7, mt: 0.5 }}>
            Organized Navigation
          </Typography>
        </DrawerHeader>
        
        <List sx={{ px: 1 }}>
          {menuStructure.map((category, index) => (
            <React.Fragment key={category.category}>
              {/* Category Header */}
              <CategoryHeader
                onClick={() => category.setOpen(!category.open)}
              >
                <ListItemIcon sx={{ color: "#fff", minWidth: 40 }}>
                  {category.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={category.category}
                  primaryTypographyProps={{
                    fontWeight: 600,
                    fontSize: "0.95rem",
                  }}
                />
                <Badge 
                  badgeContent={category.items.length} 
                  color="primary"
                  sx={{ mr: 1 }}
                />
                {category.open ? <ExpandLess /> : <ExpandMore />}
              </CategoryHeader>

              {/* Category Items */}
              <Collapse in={category.open} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {category.items.map((item) => (
                    <Tooltip
                      key={item.text}
                      title={item.description}
                      placement="left"
                      arrow
                    >
                      <StyledListItem
                        onClick={() => { 
                          navigate(item.path); 
                          setDrawerOpen(false); 
                        }}
                      >
                        <ListItemIcon sx={{ color: "rgba(255,255,255,0.7)", minWidth: 36 }}>
                          {item.icon}
                        </ListItemIcon>
                        <ListItemText 
                          primary={item.text}
                          primaryTypographyProps={{
                            fontSize: "0.875rem",
                          }}
                        />
                      </StyledListItem>
                    </Tooltip>
                  ))}
                </List>
              </Collapse>

              {/* Divider between categories */}
              {index < menuStructure.length - 1 && <CategoryDivider />}
            </React.Fragment>
          ))}
        </List>

        {/* Quick Actions Footer */}
        <Box sx={{ 
          position: "absolute", 
          bottom: 0, 
          left: 0, 
          right: 0, 
          p: 2, 
          borderTop: "1px solid rgba(255,255,255,0.1)",
          backgroundColor: "rgba(0,0,0,0.2)"
        }}>
          <Typography variant="caption" sx={{ opacity: 0.6, display: "block", mb: 0.5 }}>
            Quick Actions
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Tooltip title="Generate Timetable">
              <IconButton 
                size="small" 
                onClick={generateTimetable}
                sx={{ 
                  color: "#fff", 
                  backgroundColor: "rgba(39, 174, 96, 0.2)",
                  "&:hover": { backgroundColor: "rgba(39, 174, 96, 0.3)" }
                }}
              >
                <AddCircleIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Refresh Data">
              <IconButton 
                size="small" 
                onClick={() => setRefreshTrigger(prev => prev + 1)}
                sx={{ 
                  color: "#fff", 
                  backgroundColor: "rgba(52, 152, 219, 0.2)",
                  "&:hover": { backgroundColor: "rgba(52, 152, 219, 0.3)" }
                }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </StyledDrawer>

      <ControlsCard>
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
            <Grid item xs={12} md={1.5}>
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
            <Grid item xs={12} md={2.5}>
              <StyledTextField
                fullWidth
                label="Start Date (DD-MM-YYYY)"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                variant="outlined"
                size="small"
                InputProps={{
                  startAdornment: <CalendarTodayIcon sx={{ mr: 1, color: "#7f8c8d", fontSize: 20 }} />,
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                <StyledButton 
                  variant="contained" 
                  onClick={fetchTimetable} 
                  disabled={loading}
                  sx={{ 
                    backgroundColor: "#2c3e50",
                    "&:hover": { backgroundColor: "#34495e" }
                  }}
                  startIcon={<RefreshIcon />}
                >
                  Fetch
                </StyledButton>
                <StyledButton 
                  variant="contained" 
                  onClick={generateTimetable} 
                  disabled={loading}
                  sx={{ 
                    backgroundColor: "#27ae60",
                    "&:hover": { backgroundColor: "#229954" }
                  }}
                  startIcon={<AddCircleIcon />}
                >
                  Generate
                </StyledButton>
                <StyledButton 
                  variant="contained" 
                  onClick={sendNotifications} 
                  disabled={loading}
                  sx={{ 
                    backgroundColor: "#f39c12",
                    "&:hover": { backgroundColor: "#e67e22" }
                  }}
                  startIcon={<NotificationsIcon />}
                >
                  Notify
                </StyledButton>
                <StyledButton 
                  variant="contained" 
                  onClick={() => setOpenDownloadDialog(true)}
                  disabled={!timetable || loading}
                  sx={{ 
                    backgroundColor: "#3498db",
                    "&:hover": { backgroundColor: "#2980b9" }
                  }}
                  startIcon={<DownloadIcon />}
                >
                  Download
                </StyledButton>
                <StyledButton 
                  variant="outlined" 
                  onClick={() => setTimetable(null)} 
                  disabled={loading}
                  sx={{ 
                    borderColor: "#e74c3c",
                    color: "#e74c3c",
                    "&:hover": { 
                      borderColor: "#c0392b",
                      backgroundColor: "rgba(231, 76, 60, 0.04)"
                    }
                  }}
                  startIcon={<ClearIcon />}
                >
                  Clear
                </StyledButton>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </ControlsCard>

      {message && (
        <Alert
          severity={message.includes("Error") ? "error" : "success"}
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
            Please fetch or generate a timetable to begin
          </Typography>
        </Paper>
      ) : !Object.keys(timetable).length ? (
        <Paper sx={{ p: 8, textAlign: "center", borderRadius: "8px" }}>
          <Typography variant="h6" sx={{ color: "#7f8c8d" }}>
            No timetable data available
          </Typography>
        </Paper>
      ) : (
        <>
          {/* Visual Timetable Display */}
          <StyledCard>
            <CardContent>
              <Box sx={{ mb: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: "#2c3e50" }}>
                  Visual Timetable View
                </Typography>
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel>Select Section</InputLabel>
                  <Select
                    value={selectedSection}
                    onChange={(e) => setSelectedSection(e.target.value)}
                    label="Select Section"
                  >
                    {Object.keys(timetable).map((sec) => (
                      <MenuItem key={sec} value={sec}>Section {sec}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              {selectedSection && timetable[selectedSection] && (
                <TimetableContainer>
                  <Box sx={{ p: 2, backgroundColor: "#2c3e50", color: "#fff" }}>
                    <Typography variant="h5" sx={{ fontWeight: 600, textAlign: "center" }}>
                      {course} - Semester {semester} - Section {selectedSection}
                    </Typography>
                    <Typography variant="body2" sx={{ textAlign: "center", opacity: 0.8, mt: 0.5 }}>
                      {date} to {endDate}
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
                      {getActiveTimeSlotsForSection(selectedSection).map((timeSlot) => {
                        const isLunchSlot = timeSlot === "13:00-14:00";
                        
                        return (
                          <TableRow key={timeSlot}>
                            <TimeCell>{timeSlot}</TimeCell>
                            {days.map((day) => {
                              const slotContent = timetable[selectedSection][day]?.[timeSlot];
                              
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
                                      {slotContent.room && (
                                        <RoomNumber>
                                          <LocationOnIcon sx={{ fontSize: 12 }} />
                                          {slotContent.room}
                                        </RoomNumber>
                                      )}
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
              )}
            </CardContent>
          </StyledCard>

          {/* Detailed View - All Sections */}
          <StyledCard>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, color: "#2c3e50", mb: 2 }}>
                Detailed View - All Sections
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {Object.entries(timetable).map(([section, daysData]) => (
                <Box key={section} sx={{ mb: 4 }}>
                  <Typography
                    variant="h5"
                    sx={{ fontWeight: 600, color: "#2c3e50", mb: 2, display: "flex", alignItems: "center", gap: 1 }}
                  >
                    <SchoolIcon sx={{ fontSize: 24 }} />
                    Section {section}
                  </Typography>
                  <TimetableContainer>
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
                        {getActiveTimeSlotsForSection(section).map((timeSlot) => {
                          const isLunchSlot = timeSlot === "13:00-14:00";
                          return (
                            <TableRow key={timeSlot}>
                              <TimeCell>{timeSlot}</TimeCell>
                              {days.map((day) => {
                                const slotContent = daysData[day]?.[timeSlot];
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
                                        {slotContent.room && (
                                          <RoomNumber>
                                            <LocationOnIcon sx={{ fontSize: 12 }} />
                                            {slotContent.room}
                                          </RoomNumber>
                                        )}
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
                  </TimetableContainer>
                </Box>
              ))}
            </CardContent>
          </StyledCard>

          {/* Teacher Availability Dialog */}
          <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="sm" fullWidth>
            <DialogTitle>
              Edit Subjects for {selectedTeacher?.name || "Teacher"}
            </DialogTitle>
            <DialogContent>
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>Subjects Taught</InputLabel>
                <Select
                  multiple
                  value={editSubjects}
                  onChange={(e) => setEditSubjects(e.target.value)}
                  label="Subjects Taught"
                >
                  {SUBJECTS.flatMap((subject) =>
                    SECTIONS.map((section) => (
                      <MenuItem key={`${subject}-${section}`} value={`${subject} (${section})`}>
                        {`${subject} (${section})`}
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
              <Button onClick={handleSaveEditedSubjects} variant="contained">
                Save
              </Button>
            </DialogActions>
          </Dialog>

          {/* Download Timetable Dialog */}
          <Dialog open={openDownloadDialog} onClose={() => setOpenDownloadDialog(false)} maxWidth="sm" fullWidth>
            <DialogTitle>
              Download Timetable
            </DialogTitle>
            <DialogContent>
              <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  Choose download option:
                </Typography>
                
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <Paper 
                    onClick={() => setDownloadType("all")}
                    sx={{ 
                      p: 2, 
                      cursor: "pointer",
                      border: downloadType === "all" ? "2px solid #2c3e50" : "1px solid #e0e0e0",
                      backgroundColor: downloadType === "all" ? "#f5f5f5" : "transparent",
                      "&:hover": { backgroundColor: "#f5f5f5" }
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <RadioButtonCheckedIcon 
                        sx={{ color: downloadType === "all" ? "#2c3e50" : "#bbb" }} 
                      />
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          Download All Sections
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Downloads PDFs for all sections in current timetable
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>

                  <Paper 
                    onClick={() => setDownloadType("specific")}
                    sx={{ 
                      p: 2, 
                      cursor: "pointer",
                      border: downloadType === "specific" ? "2px solid #2c3e50" : "1px solid #e0e0e0",
                      backgroundColor: downloadType === "specific" ? "#f5f5f5" : "transparent",
                      "&:hover": { backgroundColor: "#f5f5f5" }
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <RadioButtonCheckedIcon 
                        sx={{ color: downloadType === "specific" ? "#2c3e50" : "#bbb" }} 
                      />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          Download Specific Section
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Download PDF for a specific section
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                </Box>

                {downloadType === "specific" && (
                  <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Select Section</InputLabel>
                      <Select
                        value={downloadSection}
                        onChange={(e) => setDownloadSection(e.target.value)}
                        label="Select Section"
                      >
                        {timetable && Object.keys(timetable).map((sec) => (
                          <MenuItem key={sec} value={sec}>Section {sec}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                )}

                {downloadType === "all" && timetable && (
                  <Alert severity="info" sx={{ mt: 1 }}>
                    {Object.keys(timetable).length} sections will be downloaded
                  </Alert>
                )}
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenDownloadDialog(false)}>Cancel</Button>
              <Button 
                onClick={handleDownload}
                variant="contained"
                startIcon={<DownloadIcon />}
                disabled={downloadType === "specific" && !downloadSection}
                sx={{
                  backgroundColor: "#3498db",
                  "&:hover": { backgroundColor: "#2980b9" }
                }}
              >
                Download {downloadType === "all" ? "All" : "Section"}
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </StyledContainer>
  );
}

export default AdminDashboard;
