import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Courses from './pages/Courses';
import Dashboard from './pages/Dashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Enroll from './pages/Enroll';
import Assignments from './pages/Assignments';
import AssignmentDetails from './pages/AssignmentDetails';
import CreateAssignment from './pages/CreateAssignment';
import StudentsList from './pages/StudentsList';
import Materials from './pages/Materials';

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
            <Route path="/teacher/students" element={<StudentsList />} />
            <Route path="/teacher/assignments/create" element={<CreateAssignment />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/enroll/:courseId" element={<Enroll />} />
            <Route path="/assignments" element={<Assignments />} />
            <Route path="/assignments/:assignmentId" element={<AssignmentDetails />} />
            <Route path="/materials/:courseId" element={<Materials />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;