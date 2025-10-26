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

function UnavailableTeachersPage() {
  const [unavailableTeachers, setUnavailableTeachers] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUnavailableTeachers();
  }, []);

  const fetchUnavailableTeachers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/teacher_availability`);
      const availability = response.data;
      const unavailable = Object.entries(availability)
        .filter(([_, isAvailable]) => !isAvailable)
        .map(([teacher, _]) => ({ name: teacher }));
      setUnavailableTeachers(unavailable);
      setMessage(unavailable.length > 0 ? "Unavailable teachers loaded successfully!" : "No unavailable teachers found.");
    } catch (error) {
      setMessage("Error loading unavailable teachers: " + (error.response?.data?.error || error.message));
      console.error("Fetch error:", error);
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
          Unavailable Teachers
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
            </TableRow>
          </TableHead>
          <TableBody>
            {unavailableTeachers.map((teacher) => (
              <TableRow key={teacher.name} sx={{ padding: 1 }}>
                <TableCell sx={{ padding: 2 }}>{teacher.name}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </StyledTable>
      </StyledPaper>
    </StyledContainer>
  );
}

export default UnavailableTeachersPage;
