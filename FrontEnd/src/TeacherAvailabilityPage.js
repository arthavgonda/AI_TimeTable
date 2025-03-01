import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Switch,
  FormControlLabel,
  Paper,
  Box,
  Alert,
} from "@mui/material";
import { styled } from "@mui/system";

const API_URL = "http://localhost:8000";

const StyledContainer = styled(Container)(({ theme }) => ({
  padding: theme.spacing(4),
  backgroundColor: "#f5f7fa",
  minHeight: "100vh",
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: "12px",
  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
  backgroundColor: "#ffffff",
}));

const StyledTable = styled(Table)(({ theme }) => ({
  "& .MuiTableHead-root": {
    backgroundColor: "#e3f2fd",
  },
  "& .MuiTableRow-root:nth-of-type(odd)": {
    backgroundColor: "#f5f5f5",
  },
}));

function TeacherAvailabilityPage() {
  const [teachers, setTeachers] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTeacherAvailability();
  }, []);

  const fetchTeacherAvailability = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/teacher_availability`);
      const availability = response.data;
      const teacherList = Object.entries(availability).map(([teacher, isAvailable]) => ({
        name: teacher,
        available: isAvailable,
      }));
      setTeachers(teacherList);
      setMessage("Teacher availability loaded successfully!");
    } catch (error) {
      setMessage("Error loading teacher availability: " + (error.response?.data?.error || error.message));
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateTeacherAvailability = async (teacherId, available) => {
    setLoading(true);
    setMessage("Updating availability...");
    try {
      const response = await axios.post(`${API_URL}/update_teacher_availability`, {
        teacher_id: teacherId,
        available: available,
      });
      setMessage(response.data.message);
      setTeachers((prev) =>
        prev.map((teacher) =>
          teacher.name === teacherId ? { ...teacher, available: available } : teacher
        )
      );
    } catch (error) {
      setMessage("Error updating availability: " + (error.response?.data?.detail || error.message));
      console.error("Update error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <StyledContainer>
      <StyledPaper>
        <Typography
          variant="h4"
          gutterBottom
          sx={{ fontWeight: "bold", color: "#1e88e5", marginBottom: 4 }}
        >
          Teacher Availability
        </Typography>

        {message && (
          <Alert
            severity={message.includes("Error") ? "error" : "success"}
            sx={{ marginBottom: 2, borderRadius: "8px" }}
          >
            {message}
          </Alert>
        )}

        <StyledTable>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: "bold", color: "#2196f3", padding: 2 }}>Teacher</TableCell>
              <TableCell sx={{ fontWeight: "bold", color: "#2196f3", padding: 2 }}>Availability</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {teachers.map((teacher) => (
              <TableRow key={teacher.name} sx={{ padding: 1 }}>
                <TableCell sx={{ padding: 2 }}>{teacher.name}</TableCell>
                <TableCell sx={{ padding: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={teacher.available}
                        onChange={(e) => updateTeacherAvailability(teacher.name, e.target.checked)}
                        color="primary"
                        disabled={loading}
                      />
                    }
                    label={teacher.available ? "Available" : "Unavailable"}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </StyledTable>
      </StyledPaper>
    </StyledContainer>
  );
}

export default TeacherAvailabilityPage;
