import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { 
  Container, 
  Typography, 
  Button, 
  Box, 
  Card, 
  CardContent,
  Grid,
  Paper,
} from "@mui/material";
import { 
  School, 
  AdminPanelSettings,
  Dashboard,
  Person,
  Assessment,
} from "@mui/icons-material";
import StudentDashboard from "./StudentDashboard";
import AdminDashboard from "./AdminDashboard";
import TeacherAvailabilityPage from "./TeacherAvailabilityPage";
import TeacherAssignmentPage from "./TeacherSectionAssignmentPage";
import UnavailableTeachersPage from "./UnavailableTeachersPage";
import TeacherLectureLimitPage from "./TeacherLectureLimitPage";
import TeacherManagementPage from "./TeacherManagementPage";
import ClassroomManagement from "./ClassroomManagement";
import TeacherPreferences from "./TeacherPreferences";
import RoomConflicts from "./RoomConflicts";
import TeacherLoadHeatmap from "./TeacherLoadHeatmap";
import BatchManagement from "./BatchManagement";
import SubjectDependencyManagement from "./SubjectDependencyManagement";
import QueryProvider from "./QueryProvider";
import minimalTheme from "./theme";
import "./App.css";

function App() {
  return (
    <QueryProvider>
      <ThemeProvider theme={minimalTheme}>
        <CssBaseline />
        <Router>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/student" element={<StudentDashboard />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/teacher-availability" element={<TeacherAvailabilityPage />} />
            <Route path="/assign-sections" element={<TeacherAssignmentPage />} />
            <Route path="/unavailable-teachers" element={<UnavailableTeachersPage />} />
            <Route path="/lecture-limits" element={<TeacherLectureLimitPage />} />
            <Route path="/teacher-management" element={<TeacherManagementPage />} />
            <Route path="/classroom-management" element={<ClassroomManagement />} />
            <Route path="/teacher-preferences" element={<TeacherPreferences />} />
            <Route path="/room-conflicts" element={<RoomConflicts />} />
            <Route path="/teacher-load" element={<TeacherLoadHeatmap />} />
            <Route path="/batch-management" element={<BatchManagement />} />
            <Route path="/subject-dependencies" element={<SubjectDependencyManagement />} />
          </Routes>
        </Container>
      </Router>
      </ThemeProvider>
    </QueryProvider>
  );
}

function Home() {
  return (
    <Box>
      {/* Header */}
      <Paper elevation={0} sx={{ p: 4, mb: 4, textAlign: "center", bgcolor: "primary.main", color: "primary.contrastText" }}>
        <School sx={{ fontSize: 48, mb: 2 }} />
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
          AI Timetable System
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.9 }}>
          Intelligent scheduling with classroom allocation and teacher preference management
        </Typography>
      </Paper>

      {/* Main Actions */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent sx={{ p: 3, textAlign: "center" }}>
              <Person sx={{ fontSize: 48, color: "primary.main", mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Student Dashboard
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                View your personalized timetable with room assignments and download PDFs
              </Typography>
              <Button
                component={Link}
                to="/student"
                variant="contained"
                fullWidth
                startIcon={<Dashboard />}
              >
                Access Student View
              </Button>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent sx={{ p: 3, textAlign: "center" }}>
              <AdminPanelSettings sx={{ fontSize: 48, color: "secondary.main", mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Admin Panel
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Manage teachers, classrooms, and generate optimized timetables
              </Typography>
              <Button
                component={Link}
                to="/admin"
                variant="outlined"
                fullWidth
                startIcon={<Assessment />}
              >
                Access Admin Panel
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Footer */}
      <Box sx={{ mt: 6, pt: 3, pb: 2, textAlign: "center", borderTop: "1px solid #e0e0e0" }}>
        <Typography variant="body2" color="text.secondary">
          AI-powered timetable scheduling system
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
          Automated scheduling • Room allocation • Teacher management
        </Typography>
      </Box>
    </Box>
  );
}

export default App;
