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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  LinearProgress,
  Tab,
  Tabs,
} from "@mui/material";
import { styled } from "@mui/system";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import WarningIcon from "@mui/icons-material/Warning";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useNavigate } from "react-router-dom";

const API_URL = "http:

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

function RoomConflicts() {
  const navigate = useNavigate();
  const [conflicts, setConflicts] = useState([]);
  const [utilization, setUtilization] = useState({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);

  useEffect(() => {
    fetchData();
    
    
    const intervalId = setInterval(() => {
      fetchData();
    }, 10000);
    
    return () => clearInterval(intervalId);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [conflictsResponse, utilizationResponse] = await Promise.all([
        axios.get(`${API_URL}/room_conflicts`),
        axios.get(`${API_URL}/room_utilization`),
      ]);
      setConflicts(conflictsResponse.data.conflicts || []);
      setUtilization(utilizationResponse.data || {});
      setMessage("");
    } catch (error) {
      setMessage("Error fetching data: " + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const getUtilizationColor = (percentage) => {
    if (percentage < 30) return "#27ae60";
    if (percentage < 60) return "#f39c12";
    return "#e74c3c";
  };

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
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
                  <MeetingRoomIcon sx={{ fontSize: 32 }} />
                  Room Conflicts & Utilization
                </Typography>
                <Typography variant="body2" sx={{ color: "#7f8c8d", mt: 0.5 }}>
                  Monitor room usage and detect scheduling conflicts
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

      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs value={currentTab} onChange={handleTabChange}>
          <Tab label={`Conflicts (${conflicts.length})`} />
          <Tab label={`Utilization (${Object.keys(utilization).length})`} />
        </Tabs>
      </Box>

      {/* Conflicts Tab */}
      {currentTab === 0 && (
        <StyledCard>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
              <WarningIcon sx={{ color: "#e74c3c" }} />
              Room Conflicts Detected
            </Typography>
            {conflicts.length === 0 ? (
              <Paper sx={{ p: 4, textAlign: "center", backgroundColor: "#e8f5e9" }}>
                <Typography sx={{ color: "#27ae60", fontWeight: 600 }}>
                  ✓ No room conflicts detected
                </Typography>
              </Paper>
            ) : (
              <StyledTable>
                <TableHead>
                  <TableRow>
                    <TableCell>Room</TableCell>
                    <TableCell>Day</TableCell>
                    <TableCell>Time Slot</TableCell>
                    <TableCell>Conflicting Classes</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {conflicts.map((conflict, index) => (
                    <TableRow key={index} sx={{ backgroundColor: "#ffebee" }}>
                      <TableCell sx={{ fontWeight: 600 }}>{conflict.room}</TableCell>
                      <TableCell>{conflict.day}</TableCell>
                      <TableCell>{conflict.time_slot}</TableCell>
                      <TableCell>
                        {conflict.conflicting_classes.map((cls, idx) => (
                          <Box key={idx} sx={{ mb: 1 }}>
                            <Chip
                              label={`${cls.section} - ${cls.subject}`}
                              size="small"
                              color="error"
                              sx={{ mr: 1 }}
                            />
                            <Typography variant="caption" sx={{ color: "#7f8c8d" }}>
                              {cls.teacher}
                            </Typography>
                          </Box>
                        ))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </StyledTable>
            )}
          </CardContent>
        </StyledCard>
      )}

      {/* Utilization Tab */}
      {currentTab === 1 && (
        <>
          {Object.entries(utilization).length === 0 ? (
            <Paper sx={{ p: 8, textAlign: "center", borderRadius: "8px" }}>
              <MeetingRoomIcon sx={{ fontSize: 64, color: "#e0e0e0", mb: 2 }} />
              <Typography variant="h6" sx={{ color: "#7f8c8d" }}>
                No utilization data available
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {Object.entries(utilization).map(([roomNumber, data]) => (
                <Grid item xs={12} md={6} key={roomNumber}>
                  <StyledCard>
                    <CardContent>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          Room {roomNumber}
                        </Typography>
                        <Chip
                          label={data.room_type.toUpperCase()}
                          size="small"
                          sx={{ backgroundColor: "#e3f2fd", fontWeight: 600 }}
                        />
                      </Box>
                      
                      <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid item xs={6}>
                          <Typography variant="caption" sx={{ color: "#7f8c8d" }}>
                            Building
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {data.building || "—"}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" sx={{ color: "#7f8c8d" }}>
                            Floor
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {data.floor || "—"}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" sx={{ color: "#7f8c8d" }}>
                            Capacity
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {data.capacity}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" sx={{ color: "#7f8c8d" }}>
                            Used Slots
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {data.used_slots} / {data.total_slots}
                          </Typography>
                        </Grid>
                      </Grid>

                      <Box sx={{ mb: 1 }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                          <Typography variant="caption" sx={{ color: "#7f8c8d" }}>
                            Utilization
                          </Typography>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: getUtilizationColor(data.utilization_percentage),
                              fontWeight: 600
                            }}
                          >
                            {data.utilization_percentage}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={data.utilization_percentage}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: "#e0e0e0",
                            "& .MuiLinearProgress-bar": {
                              backgroundColor: getUtilizationColor(data.utilization_percentage),
                            },
                          }}
                        />
                      </Box>

                      {data.schedule && Object.keys(data.schedule).length > 0 && (
                        <Box sx={{ mt: 2, pt: 2, borderTop: "1px solid #e0e0e0" }}>
                          <Typography variant="caption" sx={{ color: "#7f8c8d", fontWeight: 600, mb: 1, display: "block" }}>
                            Usage Schedule:
                          </Typography>
                          {Object.entries(data.schedule).map(([day, slots]) => (
                            <Box key={day} sx={{ mb: 1 }}>
                              <Typography variant="caption" sx={{ fontWeight: 600, color: "#2c3e50" }}>
                                {day}:
                              </Typography>
                              <Typography variant="caption" sx={{ color: "#7f8c8d", ml: 1 }}>
                                {slots.length} slot{slots.length > 1 ? "s" : ""}
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      )}
                    </CardContent>
                  </StyledCard>
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}
    </StyledContainer>
  );
}

export default RoomConflicts;

