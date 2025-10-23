import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Container,
  Typography,
  Paper,
  Alert,
  Box,
  Grid,
  Card,
  CardContent,
  IconButton,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  LinearProgress,
} from "@mui/material";
import { styled } from "@mui/system";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import BarChartIcon from "@mui/icons-material/BarChart";
import RefreshIcon from "@mui/icons-material/Refresh";
import PersonIcon from "@mui/icons-material/Person";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:8000";

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

const HeatmapCell = styled(Box)(({ intensity }) => {
  let backgroundColor = "#e8f5e9";
  if (intensity > 8) backgroundColor = "#c62828";
  else if (intensity > 6) backgroundColor = "#e74c3c";
  else if (intensity > 4) backgroundColor = "#f39c12";
  else if (intensity > 2) backgroundColor = "#27ae60";
  
  return {
    padding: "8px",
    textAlign: "center",
    backgroundColor,
    color: intensity > 4 ? "#fff" : "#2c3e50",
    fontWeight: 600,
    borderRadius: "4px",
    minHeight: "40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };
});

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const TIME_SLOTS = [
  "08:00-09:00",
  "09:00-10:00",
  "10:00-11:00",
  "11:00-12:00",
  "12:00-13:00",
  "13:00-14:00",
  "14:00-15:00",
  "15:00-16:00",
];

function TeacherLoadHeatmap() {
  const navigate = useNavigate();
  const [timetable, setTimetable] = useState(null);
  const [teacherLoad, setTeacherLoad] = useState({});
  const [teacherAvailability, setTeacherAvailability] = useState({});
  const [teacherPreferences, setTeacherPreferences] = useState({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Get latest timetable
      const today = new Date();
      const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
      
      const [timetableResponse, availabilityResponse, preferencesResponse] = await Promise.all([
        axios.get(`${API_URL}/timetable/${dateStr}`),
        axios.get(`${API_URL}/teacher_availability`),
        axios.get(`${API_URL}/all_teacher_preferences`),
      ]);

      setTimetable(timetableResponse.data.timetable || {});
      setTeacherAvailability(availabilityResponse.data || {});
      setTeacherPreferences(preferencesResponse.data || {});
      
      // Calculate teacher load
      calculateTeacherLoad(timetableResponse.data.timetable || {});
      setMessage("");
    } catch (error) {
      setMessage("Error fetching data: " + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const calculateTeacherLoad = (timetableData) => {
    const load = {};
    
    // Initialize structure for each teacher
    Object.keys(teacherAvailability).forEach(teacher => {
      load[teacher] = {
        total: 0,
        byDay: {},
        bySlot: {},
        schedule: {},
      };
      DAYS.forEach(day => {
        load[teacher].byDay[day] = 0;
        load[teacher].schedule[day] = {};
        TIME_SLOTS.forEach(slot => {
          load[teacher].schedule[day][slot] = 0;
        });
      });
      TIME_SLOTS.forEach(slot => {
        load[teacher].bySlot[slot] = 0;
      });
    });

    // Count lectures
    Object.entries(timetableData).forEach(([section, days]) => {
      Object.entries(days).forEach(([day, slots]) => {
        Object.entries(slots).forEach(([timeSlot, content]) => {
          const teacher = content.teacher;
          if (teacher && teacher !== "respective teacher" && load[teacher]) {
            load[teacher].total += 1;
            load[teacher].byDay[day] = (load[teacher].byDay[day] || 0) + 1;
            load[teacher].bySlot[timeSlot] = (load[teacher].bySlot[timeSlot] || 0) + 1;
            load[teacher].schedule[day][timeSlot] = (load[teacher].schedule[day][timeSlot] || 0) + 1;
          }
        });
      });
    });

    setTeacherLoad(load);
  };

  const getLoadColor = (count) => {
    if (count === 0) return "#e0e0e0";
    if (count <= 2) return "#27ae60";
    if (count <= 4) return "#f39c12";
    return "#e74c3c";
  };

  const getAvailabilityStatus = (teacher) => {
    const prefs = teacherPreferences[teacher];
    if (!prefs) return null;
    
    const hasTimeWindow = prefs.earliest_time || prefs.latest_time;
    const hasUnavailableDays = prefs.unavailable_days && prefs.unavailable_days.length > 0;
    
    if (hasTimeWindow || hasUnavailableDays) {
      return (
        <Box sx={{ mt: 1 }}>
          {hasTimeWindow && (
            <Typography variant="caption" sx={{ display: "block", color: "#7f8c8d" }}>
              ⏰ {prefs.earliest_time || "00:00"} - {prefs.latest_time || "23:59"}
            </Typography>
          )}
          {hasUnavailableDays && (
            <Typography variant="caption" sx={{ display: "block", color: "#e74c3c" }}>
              ✗ {prefs.unavailable_days.join(", ")}
            </Typography>
          )}
        </Box>
      );
    }
    return null;
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
                  <BarChartIcon sx={{ fontSize: 32 }} />
                  Teacher Load Distribution
                </Typography>
                <Typography variant="body2" sx={{ color: "#7f8c8d", mt: 0.5 }}>
                  Visualize teacher workload and availability patterns
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item>
            <IconButton 
              onClick={fetchData} 
              sx={{ 
                border: "1px solid #e0e0e0",
                backgroundColor: "#fff"
              }}
            >
              <RefreshIcon />
            </IconButton>
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

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <StyledCard>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, color: "#2c3e50" }}>
                Total Teachers
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 700, color: "#3498db", mt: 1 }}>
                {Object.keys(teacherLoad).length}
              </Typography>
            </CardContent>
          </StyledCard>
        </Grid>
        <Grid item xs={12} md={4}>
          <StyledCard>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, color: "#2c3e50" }}>
                Available Teachers
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 700, color: "#27ae60", mt: 1 }}>
                {Object.values(teacherAvailability).filter(a => a).length}
              </Typography>
            </CardContent>
          </StyledCard>
        </Grid>
        <Grid item xs={12} md={4}>
          <StyledCard>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, color: "#2c3e50" }}>
                Total Classes
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 700, color: "#f39c12", mt: 1 }}>
                {Object.values(teacherLoad).reduce((sum, t) => sum + t.total, 0)}
              </Typography>
            </CardContent>
          </StyledCard>
        </Grid>
      </Grid>

      {/* Teacher Load Table */}
      <StyledCard>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Teacher Workload Overview
          </Typography>
          <StyledTable>
            <TableHead>
              <TableRow>
                <TableCell>Teacher</TableCell>
                <TableCell align="center">Total Classes</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell>Workload Distribution</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.entries(teacherLoad)
                .sort((a, b) => b[1].total - a[1].total)
                .map(([teacher, load]) => (
                  <TableRow key={teacher}>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <PersonIcon sx={{ fontSize: 20, color: "#7f8c8d" }} />
                        <Box>
                          <Typography sx={{ fontWeight: 600 }}>{teacher}</Typography>
                          {getAvailabilityStatus(teacher)}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={load.total}
                        sx={{
                          backgroundColor: getLoadColor(load.total),
                          color: load.total > 4 ? "#fff" : "#2c3e50",
                          fontWeight: 600,
                        }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={teacherAvailability[teacher] ? "Available" : "Unavailable"}
                        size="small"
                        color={teacherAvailability[teacher] ? "success" : "error"}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ width: "100%" }}>
                        <LinearProgress
                          variant="determinate"
                          value={(load.total / 30) * 100}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: "#e0e0e0",
                            "& .MuiLinearProgress-bar": {
                              backgroundColor: getLoadColor(load.total),
                            },
                          }}
                        />
                        <Typography variant="caption" sx={{ color: "#7f8c8d", mt: 0.5 }}>
                          {Object.entries(load.byDay).map(([day, count]) => (
                            <span key={day} style={{ marginRight: "8px" }}>
                              {day.substring(0, 3)}: {count}
                            </span>
                          ))}
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </StyledTable>
        </CardContent>
      </StyledCard>

      {/* Heatmap Section */}
      <StyledCard>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Weekly Load Heatmap (Top 10 Teachers)
          </Typography>
          <Typography variant="caption" sx={{ color: "#7f8c8d", mb: 2, display: "block" }}>
            Number of concurrent classes per time slot
          </Typography>
          <Box sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, backgroundColor: "#f8f9fa" }}>Teacher</TableCell>
                  {DAYS.map(day => (
                    <TableCell key={day} align="center" sx={{ fontWeight: 600, backgroundColor: "#f8f9fa" }}>
                      {day.substring(0, 3)}
                    </TableCell>
                  ))}
                  <TableCell align="center" sx={{ fontWeight: 600, backgroundColor: "#f8f9fa" }}>Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(teacherLoad)
                  .sort((a, b) => b[1].total - a[1].total)
                  .slice(0, 10)
                  .map(([teacher, load]) => (
                    <TableRow key={teacher}>
                      <TableCell sx={{ fontWeight: 600, minWidth: 150 }}>
                        {teacher.length > 20 ? teacher.substring(0, 20) + "..." : teacher}
                      </TableCell>
                      {DAYS.map(day => (
                        <TableCell key={day} sx={{ padding: "4px" }}>
                          <HeatmapCell intensity={load.byDay[day] || 0}>
                            {load.byDay[day] || 0}
                          </HeatmapCell>
                        </TableCell>
                      ))}
                      <TableCell align="center" sx={{ fontWeight: 600 }}>
                        {load.total}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </Box>
          <Box sx={{ mt: 2, pt: 2, borderTop: "1px solid #e0e0e0" }}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: "#7f8c8d" }}>
              Color Legend:
            </Typography>
            <Box sx={{ display: "flex", gap: 2, mt: 1, flexWrap: "wrap" }}>
              <Chip label="0 classes" size="small" sx={{ backgroundColor: "#e0e0e0" }} />
              <Chip label="1-2 classes" size="small" sx={{ backgroundColor: "#27ae60", color: "#fff" }} />
              <Chip label="3-4 classes" size="small" sx={{ backgroundColor: "#f39c12", color: "#fff" }} />
              <Chip label="5+ classes" size="small" sx={{ backgroundColor: "#e74c3c", color: "#fff" }} />
            </Box>
          </Box>
        </CardContent>
      </StyledCard>
    </StyledContainer>
  );
}

export default TeacherLoadHeatmap;

