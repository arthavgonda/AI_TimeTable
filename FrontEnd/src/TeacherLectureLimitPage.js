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
  TextField,
  Paper,
  Box,
  Alert,
  Button,
} from "@mui/material";
import { styled } from "@mui/system";

const API_URL = "http:

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

function TeacherLectureLimitPage() {
  const [teachers, setTeachers] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTeacherData();
    
    
    const intervalId = setInterval(() => {
      fetchTeacherData();
    }, 30000);
    
    return () => clearInterval(intervalId);
  }, []);

  const fetchTeacherData = async () => {
    setLoading(true);
    try {
      const [availabilityResponse, lectureLimitsResponse] = await Promise.all([
        axios.get(`${API_URL}/teacher_availability`),
        axios.get(`${API_URL}/teacher_lecture_limits`), 
      ]);
      const availability = availabilityResponse.data;
      const lectureLimits = lectureLimitsResponse.data || {};
      const teacherList = Object.keys(availability).map((teacher) => ({
        name: teacher,
        available: availability[teacher],
        lectureLimit: lectureLimits[teacher] || 0,
      }));
      setTeachers(teacherList);
      setMessage("Teacher data loaded successfully!");
    } catch (error) {
      setMessage("Error loading teacher data: " + (error.response?.data?.error || error.message));
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const assignLectureLimitToTeacher = async (teacherId, limit) => {
    setLoading(true);
    setMessage("Assigning lecture limit...");
    try {
      const numericLimit = parseInt(limit, 10);
      if (isNaN(numericLimit) || numericLimit < 0) {
        throw new Error("Lecture limit must be a non-negative number");
      }

      setTeachers((prev) =>
        prev.map((teacher) =>
          teacher.name === teacherId ? { ...teacher, lectureLimit: numericLimit } : teacher
        )
      );

      await axios.post(`${API_URL}/assign_teacher_lecture_limit`, {
        teacher_id: teacherId,
        lecture_limit: numericLimit,
      });
      setMessage(`Lecture limit of ${numericLimit} assigned to ${teacherId} successfully!`);
    } catch (error) {
      setMessage("Error assigning lecture limit: " + (error.response?.data?.detail || error.message || error.message));
      console.error("Assignment error:", error);
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
          Assign Lecture Limits to Teachers
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
              <TableCell sx={{ fontWeight: "bold", color: "#2196f3", padding: 2 }}>Lecture Limit (Per Week)</TableCell>
              <TableCell sx={{ fontWeight: "bold", color: "#2196f3", padding: 2 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {teachers.map((teacher) => (
              <TableRow key={teacher.name} sx={{ padding: 1 }}>
                <TableCell sx={{ padding: 2 }}>{teacher.name}</TableCell>
                <TableCell sx={{ padding: 2 }}>
                  <TextField
                    type="number"
                    value={teacher.lectureLimit}
                    onChange={(e) => assignLectureLimitToTeacher(teacher.name, e.target.value)}
                    variant="outlined"
                    fullWidth
                    disabled={loading || !teacher.available}
                    inputProps={{ min: 0, step: 1 }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "8px",
                        backgroundColor: "#f9f9f9",
                        "& fieldset": { borderColor: "#b0bec5" },
                        "&:hover fieldset": { borderColor: "#64b5f6" },
                        "&.Mui-focused fieldset": { borderColor: "#2196f3" },
                      },
                    }}
                  />
                </TableCell>
                <TableCell sx={{ padding: 2 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => assignLectureLimitToTeacher(teacher.name, teacher.lectureLimit)}
                    disabled={loading || !teacher.available}
                  >
                    Save
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </StyledTable>
      </StyledPaper>
    </StyledContainer>
  );
}

export default TeacherLectureLimitPage;
