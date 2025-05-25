import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { Container, Typography, Button, Box } from "@mui/material";
import { styled } from "@mui/system";
import StudentDashboard from "./StudentDashboard";
import AdminDashboard from "./AdminDashboard";
import TeacherAvailabilityPage from "./TeacherAvailabilityPage";
import TeacherAssignmentPage from "./TeacherSectionAssignmentPage";
import UnavailableTeachersPage from "./UnavailableTeachersPage";
import TeacherLectureLimitPage from "./TeacherLectureLimitPage";
import TeacherManagementPage from "./TeacherManagementPage";
import "./App.css";

const StyledContainer = styled(Container)(({ theme }) => ({
  padding: theme.spacing(4),
  backgroundColor: "#f5f7fa",
  minHeight: "100vh",
}));

function App() {
  return (
    <Router>
      <StyledContainer maxWidth="lg" className="App">
        <Typography
          variant="h3"
          gutterBottom
          align="center"
          sx={{ marginTop: 4, color: "#1e88e5", fontWeight: "bold" }}
        >
          AI Timetable System
        </Typography>
        <Box sx={{ marginBottom: 4, textAlign: "center" }}>
          <Button
            component={Link}
            to="/student"
            variant="contained"
            color="primary"
            sx={{ marginRight: 2, borderRadius: "8px", textTransform: "none", fontWeight: "bold" }}
          >
            Student View
          </Button>
          <Button
            component={Link}
            to="/admin"
            variant="contained"
            color="secondary"
            sx={{ borderRadius: "8px", textTransform: "none", fontWeight: "bold" }}
          >
            Admin Panel
          </Button>
        </Box>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/student" element={<StudentDashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/teacher-availability" element={<TeacherAvailabilityPage />} />
          <Route path="/assign-sections" element={<TeacherAssignmentPage />} />
          <Route path="/unavailable-teachers" element={<UnavailableTeachersPage />} />
          <Route path="/lecture-limits" element={<TeacherLectureLimitPage />} />
          <Route path="/teacher-management" element={<TeacherManagementPage />} />
        </Routes>
      </StyledContainer>
    </Router>
  );
}

function Home() {
  return (
    <Typography
      variant="h5"
      align="center"
      sx={{ color: "#757575", marginTop: 4 }}
    >
      Welcome to AI Timetable System! Choose your view.
    </Typography>
  );
}

export default App;
