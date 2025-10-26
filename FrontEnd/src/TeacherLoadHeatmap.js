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
  TextField,
  InputAdornment,
  Button,
  CircularProgress,
} from "@mui/material";
import { styled } from "@mui/system";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import BarChartIcon from "@mui/icons-material/BarChart";
import RefreshIcon from "@mui/icons-material/Refresh";
import PersonIcon from "@mui/icons-material/Person";
import SearchIcon from "@mui/icons-material/Search";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import WarningIcon from "@mui/icons-material/Warning";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import DownloadIcon from "@mui/icons-material/Download";
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
    backgroundColor: "#f8fafc",
  },
  "& .MuiTableCell-head": {
    color: "#1e293b",
    fontWeight: 700,
    textTransform: "uppercase",
    fontSize: "12px",
    letterSpacing: "0.5px",
    borderBottom: "2px solid #e2e8f0",
  },
  "& .MuiTableCell-root": {
    borderColor: "#e2e8f0",
  },
  "& .MuiTableBody .MuiTableRow:hover": {
    backgroundColor: "#f8fafc",
  },
}));

const HeatmapCell = styled(Box)(({ intensity }) => {

  let backgroundColor = "#e5e7eb";
  let emoji = "⚪";
  
  if (intensity === 0) {
    backgroundColor = "#e5e7eb";
    emoji = "⚪";
  } else if (intensity <= 2) {
    backgroundColor = "#86efac";
    emoji = "🟢";
  } else if (intensity <= 4) {
    backgroundColor = "#fcd34d";
    emoji = "🟡";
  } else {
    backgroundColor = "#fca5a5";
    emoji = "🔴";
  }
  
  return {
    padding: "8px 12px",
    textAlign: "center",
    backgroundColor,
    color: "#1e293b",
    fontWeight: 600,
    borderRadius: "6px",
    minHeight: "44px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "2px",
    border: "1px solid #e2e8f0",
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
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredTeachers, setFilteredTeachers] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {

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
    

    setFilteredTeachers(Object.entries(load).sort((a, b) => b[1].total - a[1].total));
  };


  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredTeachers(Object.entries(teacherLoad).sort((a, b) => b[1].total - a[1].total));
    } else {
      const query = searchQuery.toLowerCase().trim();
      const filtered = Object.entries(teacherLoad)
        .filter(([teacher]) => teacher.toLowerCase().includes(query))
        .sort((a, b) => b[1].total - a[1].total);
      setFilteredTeachers(filtered);
    }
  }, [searchQuery, teacherLoad]);


  const getMetrics = () => {
    const teachers = Object.entries(teacherLoad);
    const total = teachers.length;
    const overloaded = teachers.filter(([_, load]) => load.total > 5).length;
    const optimal = teachers.filter(([_, load]) => load.total >= 1 && load.total <= 5).length;
    const available = teachers.filter(([_, load]) => load.total === 0).length;
    const totalClasses = teachers.reduce((sum, [_, load]) => sum + load.total, 0);
    const avgLoad = total > 0 ? (totalClasses / total).toFixed(1) : 0;
    
    return { total, overloaded, optimal, available, totalClasses, avgLoad };
  };


  const getDonutChartData = () => {
    const metrics = getMetrics();
    return [
      { name: "Available", value: metrics.available, color: "#8b5cf6", label: "Free" },
      { name: "Optimal", value: metrics.optimal, color: "#10b981", label: "Good" },
      { name: "Overloaded", value: metrics.overloaded, color: "#ef4444", label: "Critical" },
    ];
  };

  const getTopTeachersBarChartData = () => {
    return Object.entries(teacherLoad)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 5)
      .map(([teacher, load]) => ({
        name: teacher.length > 15 ? teacher.substring(0, 15) + "..." : teacher,
        classes: load.total,
        color: load.total > 5 ? "#ef4444" : load.total > 2 ? "#f59e0b" : "#10b981"
      }));
  };

  const getLoadColor = (count) => {
    if (count === 0) return "#d1d5db";
    if (count <= 2) return "#10b981";
    if (count <= 4) return "#f59e0b";
    return "#ef4444";
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

      {/* Improved Summary Cards */}
      {(() => {
        const metrics = getMetrics();
        return (
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={2.4}>
              <StyledCard>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                    <PersonIcon sx={{ color: "#3b82f6" }} />
                    <Typography variant="body2" sx={{ fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>
                      Total Teachers
                    </Typography>
                  </Box>
                  <Typography variant="h3" sx={{ fontWeight: 700, color: "#1e293b" }}>
                    {metrics.total}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                    Active in system
                  </Typography>
                </CardContent>
              </StyledCard>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <StyledCard>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                    <WarningIcon sx={{ color: "#ef4444" }} />
                    <Typography variant="body2" sx={{ fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>
                      Overloaded
                    </Typography>
                  </Box>
                  <Typography variant="h3" sx={{ fontWeight: 700, color: "#ef4444" }}>
                    {metrics.overloaded}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                    {metrics.total > 0 ? `${Math.round((metrics.overloaded / metrics.total) * 100)}% of teachers` : "0%"}
                  </Typography>
                </CardContent>
              </StyledCard>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <StyledCard>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                    <CheckCircleIcon sx={{ color: "#10b981" }} />
                    <Typography variant="body2" sx={{ fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>
                      Optimal Load
                    </Typography>
                  </Box>
                  <Typography variant="h3" sx={{ fontWeight: 700, color: "#10b981" }}>
                    {metrics.optimal}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                    {metrics.total > 0 ? `${Math.round((metrics.optimal / metrics.total) * 100)}% of teachers` : "0%"}
                  </Typography>
                </CardContent>
              </StyledCard>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <StyledCard>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                    <TrendingUpIcon sx={{ color: "#8b5cf6" }} />
                    <Typography variant="body2" sx={{ fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>
                      Available
                    </Typography>
                  </Box>
                  <Typography variant="h3" sx={{ fontWeight: 700, color: "#8b5cf6" }}>
                    {metrics.available}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                    No classes assigned
                  </Typography>
                </CardContent>
              </StyledCard>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <StyledCard>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                    <BarChartIcon sx={{ color: "#f59e0b" }} />
                    <Typography variant="body2" sx={{ fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>
                      Avg Load
                    </Typography>
                  </Box>
                  <Typography variant="h3" sx={{ fontWeight: 700, color: "#f59e0b" }}>
                    {metrics.avgLoad}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                    Classes per teacher
                  </Typography>
                </CardContent>
              </StyledCard>
            </Grid>
          </Grid>
        );
      })()}

      {/* Visualizations Section */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <StyledCard>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, color: "#1e293b", mb: 3 }}>
                Workload Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={getDonutChartData()}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {getDonutChartData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => `${value} teachers`}
                    contentStyle={{ 
                      backgroundColor: "#fff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px"
                    }}
                  />
                  <Legend 
                    verticalAlign="bottom"
                    formatter={(value) => getDonutChartData().find(d => d.name === value)?.label || value}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </StyledCard>
        </Grid>
        <Grid item xs={12} md={6}>
          <StyledCard>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, color: "#1e293b", mb: 3 }}>
                Top 5 Most Loaded Teachers
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getTopTeachersBarChartData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "#fff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px"
                    }}
                    formatter={(value) => `${value} classes`}
                  />
                  <Bar dataKey="classes" radius={[8, 8, 0, 0]}>
                    {getTopTeachersBarChartData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </StyledCard>
        </Grid>
      </Grid>

      {/* Teacher Load Table */}
      <StyledCard>
        <CardContent>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: "#1e293b" }}>
              Teacher Workload Overview
            </Typography>
            <IconButton 
              size="small"
              onClick={fetchData}
              sx={{ 
                border: "1px solid #e2e8f0",
                backgroundColor: "#ffffff"
              }}
            >
              <DownloadIcon />
            </IconButton>
          </Box>

          {/* Search Bar */}
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              placeholder="Search teachers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "10px",
                  backgroundColor: "#ffffff",
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: "#64748b" }} />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          <StyledTable>
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: "60px" }}>Sr.No.</TableCell>
                <TableCell>Teacher</TableCell>
                <TableCell align="center">Load</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell>Weekly Distribution</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTeachers.map(([teacher, load], index) => {
                const getRankEmoji = (rank) => {
                  if (rank === 1) return "1";
                  if (rank === 2) return "2";
                  if (rank === 3) return "3";
                  return rank;
                };

                const getLoadSeverity = (count) => {
                  if (count > 5) return { label: "Critical", color: "#ef4444", emoji: "" };
                  if (count > 2) return { label: "High", color: "#f59e0b", emoji: "" };
                  if (count > 0) return { label: "Good", color: "#10b981", emoji: "" };
                  return { label: "Free", color: "#9ca3af", emoji: "" };
                };

                const severity = getLoadSeverity(load.total);
                
                return (
                  <TableRow key={teacher}>
                    <TableCell>
                      <Typography sx={{ fontWeight: 700, fontSize: "16px", textAlign: "center" }}>
                        {getRankEmoji(index + 1)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <PersonIcon sx={{ fontSize: 24, color: "#64748b" }} />
                        <Box>
                          <Typography sx={{ fontWeight: 600, fontSize: "15px", color: "#1e293b" }}>
                            {teacher}
                          </Typography>
                          {getAvailabilityStatus(teacher)}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Box>
                        <Chip
                          label={`${severity.emoji} ${load.total} classes`}
                          size="small"
                          sx={{
                            backgroundColor: severity.color,
                            color: "#fff",
                            fontWeight: 600,
                            height: "28px",
                          }}
                        />
                        <Typography variant="caption" sx={{ color: severity.color, fontWeight: 600, mt: 0.5, display: "block" }}>
                          {severity.label}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={teacherAvailability[teacher] ? "Available" : "Unavailable"}
                        size="small"
                        sx={{
                          backgroundColor: teacherAvailability[teacher] ? "#d1fae5" : "#fee2e2",
                          color: teacherAvailability[teacher] ? "#065f46" : "#991b1b",
                          fontWeight: 600,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ width: "100%" }}>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min((load.total / 15) * 100, 100)}
                          sx={{
                            height: "12px",
                            borderRadius: "6px",
                            backgroundColor: "#f1f5f9",
                            "& .MuiLinearProgress-bar": {
                              backgroundColor: severity.color,
                              borderRadius: "6px",
                            },
                          }}
                        />
                        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}>
                          <Typography variant="caption" sx={{ color: "#64748b", fontSize: "11px", fontWeight: 600 }}>
                            Total: {load.total} classes
                          </Typography>
                          <Typography variant="caption" sx={{ color: severity.color, fontSize: "11px", fontWeight: 700 }}>
                            {Math.round((load.total / 15) * 100)}%
                          </Typography>
                        </Box>
                        <Box sx={{ display: "flex", gap: 2, mt: 1.5, flexWrap: "wrap", justifyContent: "center" }}>
                          {DAYS.map(day => {
                            const dayCount = load.byDay[day] || 0;
                            return (
                              <Box
                                key={day}
                                sx={{
                                  display: "flex",
                                  flexDirection: "column",
                                  alignItems: "center",
                                  gap: 0.5,
                                  minWidth: "50px",
                                  flex: "0 0 auto",
                                }}
                              >
                                <Typography 
                                  variant="caption" 
                                  sx={{ 
                                    fontSize: "10px", 
                                    color: "#64748b",
                                    fontWeight: 600,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.5px",
                                  }}
                                >
                                  {day.substring(0, 3)}
                                </Typography>
                                <Chip
                                  label={dayCount}
                                  size="small"
                                  sx={{
                                    height: "28px",
                                    fontSize: "12px",
                                    backgroundColor: dayCount > 0 ? getLoadColor(dayCount) : "#f3f4f6",
                                    color: dayCount > 0 ? "#1e293b" : "#9ca3af",
                                    fontWeight: 700,
                                    minWidth: "44px",
                                    border: "1px solid rgba(226, 232, 240, 0.5)",
                                  }}
                                />
                              </Box>
                            );
                          })}
                        </Box>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
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
          <Box sx={{ mt: 3, pt: 3, borderTop: "2px solid #e2e8f0", backgroundColor: "#f8fafc", borderRadius: "8px", p: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#1e293b", mb: 2 }}>
              Load Intensity Legend
            </Typography>
            <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap", alignItems: "center" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box sx={{ width: "24px", height: "24px", backgroundColor: "#e5e7eb", borderRadius: "4px", border: "1px solid #d1d5db" }} />
                <Typography variant="body2" sx={{ color: "#64748b", fontWeight: 500 }}>
                  ⚪ Free (0 classes)
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box sx={{ width: "24px", height: "24px", backgroundColor: "#86efac", borderRadius: "4px", border: "1px solid #10b981" }} />
                <Typography variant="body2" sx={{ color: "#64748b", fontWeight: 500 }}>
                  🟢 Light (1-2 classes)
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box sx={{ width: "24px", height: "24px", backgroundColor: "#fcd34d", borderRadius: "4px", border: "1px solid #f59e0b" }} />
                <Typography variant="body2" sx={{ color: "#64748b", fontWeight: 500 }}>
                  🟡 Moderate (3-4 classes)
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box sx={{ width: "24px", height: "24px", backgroundColor: "#fca5a5", borderRadius: "4px", border: "1px solid #ef4444" }} />
                <Typography variant="body2" sx={{ color: "#64748b", fontWeight: 500 }}>
                  🔴 Heavy (5+ classes)
                </Typography>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </StyledCard>
    </StyledContainer>
  );
}

export default TeacherLoadHeatmap;

