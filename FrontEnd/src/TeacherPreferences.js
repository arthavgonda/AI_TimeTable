import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Container,
  Typography,
  Button,
  Paper,
  Alert,
  Box,
  Grid,
  Card,
  CardContent,
  TextField,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
} from "@mui/material";
import { styled } from "@mui/system";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import SaveIcon from "@mui/icons-material/Save";
import EventBusyIcon from "@mui/icons-material/EventBusy";
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

function TeacherPreferences() {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [preferences, setPreferences] = useState({
    earliest_time: "",
    latest_time: "",
    preferred_days: [],
    preferred_slots: [],
    unavailable_days: [],
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTeachers();
  }, []);

  useEffect(() => {
    if (selectedTeacher) {
      fetchTeacherPreferences(selectedTeacher);
    }
  }, [selectedTeacher]);

  const fetchTeachers = async () => {
    try {
      const response = await axios.get(`${API_URL}/teacher_availability`);
      const teacherList = Object.keys(response.data);
      setTeachers(teacherList);
    } catch (error) {
      setMessage("Error fetching teachers: " + error.message);
    }
  };

  const fetchTeacherPreferences = async (teacherId) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/teacher_preferences/${teacherId}`);
      setPreferences({
        earliest_time: response.data.earliest_time || "",
        latest_time: response.data.latest_time || "",
        preferred_days: response.data.preferred_days || [],
        preferred_slots: response.data.preferred_slots || [],
        unavailable_days: response.data.unavailable_days || [],
      });
      setMessage("");
    } catch (error) {
      setMessage("Error fetching preferences: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    if (!selectedTeacher) {
      setMessage("Please select a teacher");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/update_teacher_preferences`, {
        teacher_id: selectedTeacher,
        earliest_time: preferences.earliest_time || null,
        latest_time: preferences.latest_time || null,
        preferred_days: preferences.preferred_days,
        preferred_slots: preferences.preferred_slots,
        unavailable_days: preferences.unavailable_days,
      });
      setMessage("Preferences updated successfully! Timetable regenerated.");
    } catch (error) {
      setMessage("Error updating preferences: " + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleTimeChange = (field, value) => {
    setPreferences({ ...preferences, [field]: value });
  };

  const handleMultiSelectChange = (field, value) => {
    setPreferences({ ...preferences, [field]: value });
  };

  return (
    <StyledContainer maxWidth="lg">
      <HeaderSection>
        <Grid container alignItems="center" justifyContent="space-between">
          <Grid item>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <IconButton onClick={() => navigate("/admin")} sx={{ color: "#2c3e50" }}>
                <ArrowBackIcon />
              </IconButton>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 600, color: "#2c3e50", display: "flex", alignItems: "center", gap: 1 }}>
                  <AccessTimeIcon sx={{ fontSize: 32 }} />
                  Teacher Availability & Preferences
                </Typography>
                <Typography variant="body2" sx={{ color: "#7f8c8d", mt: 0.5 }}>
                  Set time windows and scheduling preferences for teachers
                </Typography>
              </Box>
            </Box>
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

      <StyledCard>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
            Select Teacher
          </Typography>
          <FormControl fullWidth>
            <InputLabel>Teacher</InputLabel>
            <Select
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              label="Teacher"
            >
              <MenuItem value="">
                <em>Select a teacher</em>
              </MenuItem>
              {teachers.map((teacher) => (
                <MenuItem key={teacher} value={teacher}>
                  {teacher}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </CardContent>
      </StyledCard>

      {selectedTeacher && (
        <>
          <StyledCard>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Time Window
              </Typography>
              <Typography variant="body2" sx={{ color: "#7f8c8d", mb: 3 }}>
                Set the earliest and latest times this teacher is available for classes
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Earliest Available Time"
                    type="time"
                    value={preferences.earliest_time}
                    onChange={(e) => handleTimeChange("earliest_time", e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ step: 3600 }}
                  />
                  <Typography variant="caption" sx={{ color: "#7f8c8d", mt: 1, display: "block" }}>
                    No classes will be scheduled before this time
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Latest Available Time"
                    type="time"
                    value={preferences.latest_time}
                    onChange={(e) => handleTimeChange("latest_time", e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ step: 3600 }}
                  />
                  <Typography variant="caption" sx={{ color: "#7f8c8d", mt: 1, display: "block" }}>
                    No classes will be scheduled at or after this time
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </StyledCard>

          <StyledCard>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Day Preferences
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Preferred Days</InputLabel>
                    <Select
                      multiple
                      value={preferences.preferred_days}
                      onChange={(e) => handleMultiSelectChange("preferred_days", e.target.value)}
                      input={<OutlinedInput label="Preferred Days" />}
                      renderValue={(selected) => (
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                          {selected.map((value) => (
                            <Chip key={value} label={value} size="small" />
                          ))}
                        </Box>
                      )}
                    >
                      {DAYS.map((day) => (
                        <MenuItem key={day} value={day}>
                          {day}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Typography variant="caption" sx={{ color: "#7f8c8d", mt: 1, display: "block" }}>
                    Scheduler will prioritize these days (optional)
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Unavailable Days</InputLabel>
                    <Select
                      multiple
                      value={preferences.unavailable_days}
                      onChange={(e) => handleMultiSelectChange("unavailable_days", e.target.value)}
                      input={<OutlinedInput label="Unavailable Days" />}
                      renderValue={(selected) => (
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                          {selected.map((value) => (
                            <Chip key={value} label={value} size="small" color="error" />
                          ))}
                        </Box>
                      )}
                    >
                      {DAYS.map((day) => (
                        <MenuItem key={day} value={day}>
                          {day}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Typography variant="caption" sx={{ color: "#7f8c8d", mt: 1, display: "block" }}>
                    No classes will be scheduled on these days
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </StyledCard>

          <StyledCard>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Preferred Time Slots
              </Typography>
              <Typography variant="body2" sx={{ color: "#7f8c8d", mb: 3 }}>
                Select time slots where this teacher prefers to teach (optional)
              </Typography>
              <FormControl fullWidth>
                <InputLabel>Preferred Time Slots</InputLabel>
                <Select
                  multiple
                  value={preferences.preferred_slots}
                  onChange={(e) => handleMultiSelectChange("preferred_slots", e.target.value)}
                  input={<OutlinedInput label="Preferred Time Slots" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {TIME_SLOTS.map((slot) => (
                    <MenuItem key={slot} value={slot}>
                      {slot}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </CardContent>
          </StyledCard>

          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => {
                setSelectedTeacher("");
                setPreferences({
                  earliest_time: "",
                  latest_time: "",
                  preferred_days: [],
                  preferred_slots: [],
                  unavailable_days: [],
                });
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSavePreferences}
              disabled={loading}
              sx={{
                backgroundColor: "#27ae60",
                "&:hover": { backgroundColor: "#229954" },
                textTransform: "none",
                fontWeight: 600,
              }}
            >
              Save Preferences & Regenerate Timetable
            </Button>
          </Box>
        </>
      )}

      {!selectedTeacher && (
        <Paper sx={{ p: 8, textAlign: "center", borderRadius: "8px" }}>
          <EventBusyIcon sx={{ fontSize: 64, color: "#e0e0e0", mb: 2 }} />
          <Typography variant="h6" sx={{ color: "#7f8c8d" }}>
            Select a teacher to manage their availability preferences
          </Typography>
        </Paper>
      )}
    </StyledContainer>
  );
}

export default TeacherPreferences;

