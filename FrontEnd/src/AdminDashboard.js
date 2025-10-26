import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useQuery } from "@tanstack/react-query";
import useAutoRefresh from "./hooks/useAutoRefresh";
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
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:8000";



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
    borderColor: "#e2e8f0",
  },
  "& .MuiTableBody .MuiTableRow:nth-of-type(odd) .MuiTableCell": {
    backgroundColor: "#ffffff",
  },
  "& .MuiTableBody .MuiTableRow:nth-of-type(even) .MuiTableCell": {
    backgroundColor: "#f8fafc",
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
  backgroundColor: "#f8fafc",
  color: "#1e293b",
  fontWeight: 700,
  textAlign: "center",
  padding: "16px 12px",
  fontSize: "0.875rem",
  borderBottom: "2px solid #e2e8f0",
  borderRight: "1px solid #e2e8f0",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
}));

const ClassCell = styled(TableCell)(({ theme }) => ({
  padding: "12px 8px",
  textAlign: "center",
  verticalAlign: "middle",
  backgroundColor: "#ffffff",
  borderRight: "1px solid #e2e8f0",
  borderBottom: "1px solid #e2e8f0",
  minHeight: "90px",
  transition: "background-color 0.2s ease",
  "&:hover": {
    backgroundColor: "#f8fafc",
  },
}));

const SubjectBox = styled(Box)(({ theme, bgColor }) => ({
  backgroundColor: bgColor || "#f1f5f9",
  padding: "10px 12px",
  borderRadius: "8px",
  height: "100%",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  transition: "all 0.2s ease",
  cursor: "pointer",
  border: "1px solid rgba(226, 232, 240, 0.8)",
  "&:hover": {
    transform: "translateY(-2px)",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    borderColor: "#cbd5e1",
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

const EmptySlot = styled(Box)(({ theme }) => ({
  minHeight: "60px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
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


const subjectColorPalette = [
  "#dbeafe",
  "#e0e7ff",
  "#d1fae5",
  "#fef3c7",
  "#fce7f3",
  "#ccfbf1",
  "#f0fdfa",
  "#ede9fe",
  "#fef2f2",
  "#f5f3ff",
  "#f9fafb",
  "#f1f5f9",
  "#e0f2fe",
];


const getSubjectColor = (subject) => {
  if (!subject) return "#f9fafb";
  

  if (subject.includes("Elective") || subject.toLowerCase().includes("elective")) {
    return "#e0f2fe";
  }
  

  let hash = 0;
  for (let i = 0; i < subject.length; i++) {
    hash = subject.charCodeAt(i) + ((hash << 5) - hash);
  }
  return subjectColorPalette[Math.abs(hash) % subjectColorPalette.length];
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
  const [course, setCourse] = useState("");
  const [semester, setSemester] = useState("");
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
  

  const [openTeachers, setOpenTeachers] = useState(false);
  const [openScheduling, setOpenScheduling] = useState(false);
  const [openClassrooms, setOpenClassrooms] = useState(false);
  const [openAnalytics, setOpenAnalytics] = useState(false);
  const [openAcademicSetup, setOpenAcademicSetup] = useState(false);
  

  const [openDownloadDialog, setOpenDownloadDialog] = useState(false);
  const [downloadType, setDownloadType] = useState("all");
  const [downloadCourse, setDownloadCourse] = useState("");
  const [downloadSemester, setDownloadSemester] = useState("");
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
  

  const [subjects, setSubjects] = useState([]);

  const parseDate = (dateStr) => {
    const [day, month, year] = dateStr.split("-");
    return `${year}-${month}-${day}`;
  };

  const calculateWeekDates = (startDateStr) => {

    if (!startDateStr || typeof startDateStr !== 'string') {
      return {};
    }
    
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


  useEffect(() => {
    if (course && semester) {
      const loadSections = async () => {
        try {


          const batchesResponse = await axios.get(`${API_URL}/batches`);
          const batches = batchesResponse.data.batches || [];
          


          const matchingBatch = batches.find(b => 
            b.batch_type === course && b.semester === parseInt(semester)
          );
          
          if (matchingBatch) {

            const sectionsResponse = await axios.get(`${API_URL}/batches/${matchingBatch.id}/sections`);
            const sections = sectionsResponse.data.sections || [];

            setAvailableSections(sections.map(s => s.section_letter));
          } else {

            setAvailableSections([]);
          }
        } catch (error) {
          console.error("Error loading sections:", error);
          setAvailableSections([]);
        }
      };
      loadSections();
    } else {

      setAvailableSections([]);
    }
  }, [course, semester]);


  const { data: timetableData, refetch: refetchTimetable } = useQuery({
    queryKey: ['timetable', date, course, semester],
    queryFn: async () => {
      const backendDate = parseDate(date);
      const response = await axios.get(`${API_URL}/timetable/${backendDate}`, { timeout: 60000 });
      return response.data.timetable || {};
    },
    refetchInterval: 45000,
    enabled: !!date,
    staleTime: 20000,
  });


  const { data: availabilityData, refetch: refetchAvailability } = useQuery({
    queryKey: ['teacher_availability'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/teacher_availability`);
      return response.data;
    },
    refetchInterval: 30000,
    staleTime: 15000,
  });


  const { NotificationComponent: TimetableNotification } = useAutoRefresh(refetchTimetable, {
    interval: 45000,
    enabled: true,
    showNotifications: true,
  });

  const { NotificationComponent: AvailabilityNotification } = useAutoRefresh(refetchAvailability, {
    interval: 30000,
    enabled: true,
    showNotifications: false,
  });

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
        if (timetableResponse.data.date) {
          setWeekDates(calculateWeekDates(timetableResponse.data.date));
        }
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
      if (response.data.date) {
        setWeekDates(calculateWeekDates(response.data.date));
      }
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
    setMessage(`Starting background generation...`);
    
    try {
      const backendDate = parseDate(date);
      

      const startResponse = await axios.get(
        `${API_URL}/generate?date=${backendDate}&course=${course}&semester=${semester}&async_mode=true`
      );
      
      if (startResponse.data.error) {
        setMessage(`Error: ${startResponse.data.error}`);
        setLoading(false);
        return;
      }
      
      const taskId = startResponse.data.task_id;
      setMessage(`Task started (ID: ${taskId.substring(0, 8)}...)`);
      

      let pollCount = 0;
      const maxPolls = 300;
      
      const pollStatus = async () => {
        try {
          const statusResponse = await axios.get(`${API_URL}/task/${taskId}`);
          const task = statusResponse.data;
          

          setMessage(`${task.message} (${task.progress}%)`);
          

          if (task.status === "completed") {
            setTimetable(task.result.timetable || {});
            setEndDate(formatDate(new Date(task.result.end_date)));
            setDate(formatDate(new Date(task.result.date)));
            if (task.result.date) {
              setWeekDates(calculateWeekDates(task.result.date));
            }
            if (Object.keys(task.result.timetable || {}).length > 0) {
              setSelectedSection(Object.keys(task.result.timetable)[0]);
      }
            setMessage(`Timetable generated successfully for ${course} Semester ${semester}!`);
            setRefreshTrigger((prev) => prev + 1);
            setLoading(false);
            return;
          }
          

          if (task.status === "failed") {
            setMessage(`Error: ${task.error || task.message}`);
            setLoading(false);
            return;
          }
          

          if (task.status === "running") {

            pollCount++;
            if (pollCount >= maxPolls) {
              setMessage("Timeout: Timetable generation taking too long");
              setLoading(false);
              return;
            }
            

            setTimeout(pollStatus, 2000);
          }
          
        } catch (error) {
          console.error("Polling error:", error);
          pollCount++;
          
          if (pollCount >= maxPolls) {
            setMessage("Error polling task status: Timeout");
            setLoading(false);
            return;
          }
          

          setTimeout(pollStatus, 2000);
        }
      };
      

      setTimeout(pollStatus, 1000);
      
    } catch (error) {
      setMessage("Error starting timetable generation: " + (error.response?.data?.error || error.message));
      console.error("Start error:", error);
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
      

      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      document.body.appendChild(tempContainer);
      




      tempContainer.innerHTML = `
        <div style="padding: 30px; background: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="padding: 24px 32px; background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); border-left: 4px solid #3b82f6; border-bottom: 1px solid #e2e8f0; margin-bottom: 20px; text-align: center;">
            <h2 style="margin: 0; font-size: 24px; font-weight: 700; color: #1e293b;">${course} - Semester ${semester} - Section ${sectionToDownload}</h2>
            <p style="margin: 8px 0 0 0; font-size: 14px; color: #64748b; font-weight: 500;">${date} to ${endDate}</p>
          </div>
          <table style="width: 100%; border-collapse: collapse; background: white; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border-radius: 8px; overflow: hidden;">
            <thead>
              <tr>
                <th style="border: 1px solid #e2e8f0; padding: 14px 16px; background: #f8fafc; font-weight: 700; color: #1e293b; text-transform: uppercase; letter-spacing: 0.5px; font-size: 12px;">Time</th>
                ${days.map((day, idx) => `<th style="border: 1px solid #e2e8f0; padding: 14px 16px; background: #f8fafc; font-weight: 700; color: #1e293b; text-transform: uppercase; letter-spacing: 0.5px; font-size: 12px;">${day}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${getActiveTimeSlotsForSection(sectionToDownload).map((timeSlot, idx) => `
                <tr style="background: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
                  <td style="border: 1px solid #e2e8f0; padding: 16px; background: #f8fafc; font-weight: 600; color: #2c3e50; text-align: center;">${timeSlot}</td>
                  ${days.map(day => {
                    const content = timetable[sectionToDownload]?.[day]?.[timeSlot];
                    if (!content) return '<td style="border: 1px solid #e2e8f0; padding: 16px;"></td>';
                    if (content.subject === "Lunch") {
                      return '<td style="border: 1px solid #e2e8f0; padding: 12px; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; text-align: center; font-weight: 600; color: #856404;">LUNCH BREAK</td>';
                    }
                    const bgColor = getSubjectColor(content.subject);
                    return `<td style="border: 1px solid #e2e8f0; padding: 12px; text-align: center; vertical-align: middle;">
                      <div style="background: ${bgColor}; padding: 10px 12px; border-radius: 8px; border: 1px solid rgba(226, 232, 240, 0.8); min-height: 60px; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                        <div style="font-weight: 700; font-size: 14px; color: #2c3e50; margin-bottom: 4px;">${content.subject || ''}</div>
                        <div style="font-size: 11px; color: #546e7a; font-style: italic;">${content.teacher === "respective teacher" ? "Elective Faculty" : content.teacher || "TBA"}</div>
                        ${content.room ? `<div style="font-size: 10px; color: #ef4444; font-weight: 600; margin-top: 4px;">📍 ${content.room}</div>` : ''}
                      </div>
                    </td>`;
                  }).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;

      const canvas = await html2canvas(tempContainer, {
        scale: 3,
        useCORS: true,
        logging: false,
        backgroundColor: '#f8fafc',
        windowWidth: 1200,
        windowHeight: 1600,
        allowTaint: false,
        removeContainer: true,
      });

      document.body.removeChild(tempContainer);

      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      

      const margin = 10;
      const maxWidth = pdfWidth - (2 * margin);
      const maxHeight = pdfHeight - (2 * margin);
      const ratio = Math.min(maxWidth / (imgWidth / 3.78), maxHeight / (imgHeight / 3.78));
      
      const imgX = (pdfWidth - (imgWidth / 3.78 * ratio)) / 2;
      const imgY = margin;

      pdf.addImage(imgData, 'PNG', imgX, imgY, (imgWidth / 3.78) * ratio, (imgHeight / 3.78) * ratio, undefined, 'FAST');
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
      category: "Academic Setup",
      icon: <SchoolIcon />,
      open: openAcademicSetup,
      setOpen: setOpenAcademicSetup,
      items: [
        { text: "Batch Management", icon: <SchoolIcon />, path: "/batch-management", description: "Manage batches, sections, subjects, and electives" },
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


  useEffect(() => {
    if (timetableData) {
      setTimetable(timetableData);
    }
  }, [timetableData]);

  useEffect(() => {
    if (availabilityData) {
      setTeacherAvailability(availabilityData);
    }
  }, [availabilityData]);

  return (
    <StyledContainer maxWidth="xl">
      {TimetableNotification}
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
                  displayEmpty
                >
                  <MenuItem value="">
                    <em>Select Course</em>
                  </MenuItem>
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
                  disabled={!course}
                  displayEmpty
                >
                  <MenuItem value="">
                    <em>Select Semester</em>
                  </MenuItem>
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
            animation: 'slideIn 0.3s ease-out'
          }}
        >
          {message.includes("Error") ? (
            <Box sx={{ fontSize: '24px' }}>⚠️</Box>
          ) : (
            <Box sx={{ fontSize: '24px' }}>✅</Box>
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
                    {availableSections.length > 0 
                      ? availableSections.map((sec) => (
                          <MenuItem key={sec} value={sec}>Section {sec}</MenuItem>
                        ))
                      : Object.keys(timetable || {}).map((sec) => (
                          <MenuItem key={sec} value={sec}>Section {sec}</MenuItem>
                        ))
                    }
                  </Select>
                </FormControl>
              </Box>

              {selectedSection && timetable[selectedSection] && (
                <TimetableContainer>
                  <Box sx={{ 
                    p: 3, 
                    background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
                    borderLeft: "4px solid #3b82f6",
                    borderBottom: "1px solid #e2e8f0"
                  }}>
                    <Typography 
                      variant="h5" 
                      sx={{ 
                        fontWeight: 700, 
                        textAlign: "center",
                        color: "#1e293b",
                        mb: 0.5
                      }}
                    >
                      {course} - Semester {semester} - Section {selectedSection}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        textAlign: "center", 
                        color: "#64748b",
                        mt: 0.5,
                        fontWeight: 500
                      }}
                    >
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
                                    <SubjectBox bgColor={getSubjectColor(slotContent.subject)}>
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
                                    <EmptySlot></EmptySlot>
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
                      {Object.values(timetable || {})
                        .flatMap(sectionData => Object.values(sectionData || {}))
                        .flatMap(dayData => Object.values(dayData || {}))
                        .map(slot => slot?.subject)
                        .filter((subject, index, self) => subject && subject !== "Lunch" && self.indexOf(subject) === index)
                        .map(subject => (
                          <Grid item key={subject}>
                            <Chip
                              label={subject}
                              size="small"
                              sx={{
                                backgroundColor: getSubjectColor(subject),
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
                                    {slotContent && slotContent.subject !== "Lunch" && 
                                     slotContent.teacher && 
                                     slotContent.teacher !== "respective teacher" &&
                                     slotContent.teacher !== "Elective Faculty" &&
                                     slotContent.teacher.trim() !== "" ? (
                                      <SubjectBox bgColor={getSubjectColor(slotContent.subject)}>
                                        <SubjectCode>{slotContent.subject}</SubjectCode>
                                        <TeacherName>
                                          {slotContent.teacher}
                                        </TeacherName>
                                        {slotContent.room && (
                                          <RoomNumber>
                                            <LocationOnIcon sx={{ fontSize: 12 }} />
                                            {slotContent.room}
                                          </RoomNumber>
                                        )}
                                      </SubjectBox>
                                    ) : (
                                      <EmptySlot></EmptySlot>
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
                  {/* Options will be loaded dynamically from database */}
                  {availableSections.map(section => (
                    <MenuItem key={section} value={section}>
                      {section}
                    </MenuItem>
                  ))}
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
                        {availableSections.length > 0 
                          ? availableSections.map((sec) => (
                              <MenuItem key={sec} value={sec}>Section {sec}</MenuItem>
                            ))
                          : timetable && Object.keys(timetable).map((sec) => (
                              <MenuItem key={sec} value={sec}>Section {sec}</MenuItem>
                            ))
                        }
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
