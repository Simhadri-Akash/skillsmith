import { useState, useEffect } from 'react';
import { BookOpen, Clock, Award, BarChart, Calendar } from 'lucide-react';
import axios from 'axios';
import { Link } from 'react-router-dom';

interface Course {
  _id: number;
  title: string;
  description: string;
  instructor: string;
  duration: string;
  rating: number;
  image: string;
  topics: string[];
  progress?: number;
}

interface Assignment {
  _id: string;
  title: string;
  dueDate: string;
  courseId: number;
  submitted?: boolean;
  score?: number;
}

interface VideoProgress {
  totalSeconds: number;
}

export default function Dashboard() {
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [totalWatchTime, setTotalWatchTime] = useState<number>(0);
  const [averageScore, setAverageScore] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // First get enrollments
        const enrollmentsResponse = await axios.get('http://localhost:5000/api/enrollments', {
          headers: { Authorization: `Bearer ${token}` }
        });

        // If no enrollments, set empty courses array and continue with other data
        if (enrollmentsResponse.data.length === 0) {
          setEnrolledCourses([]);
        } else {
          // Process enrolled courses
          const coursePromises = enrollmentsResponse.data.map(async (enrollment: any) => {
            try {
              const courseResponse = await axios.get(`http://localhost:5000/api/courses/${enrollment.courseId}`);
              return {
                ...courseResponse.data.course,
                progress: Math.floor(Math.random() * 100) // Will be replaced with actual progress
              };
            } catch (err) {
              console.warn(`Failed to fetch course ${enrollment.courseId}:`, err);
              return null;
            }
          });

          const courses = (await Promise.all(coursePromises)).filter(Boolean);
          setEnrolledCourses(courses);

          // Fetch assignments for enrolled courses
          const assignmentPromises = courses.map(course => 
            axios.get(`http://localhost:5000/api/assignments/course/${course._id}`, {
              headers: { Authorization: `Bearer ${token}` }
            })
          );

          try {
            const assignmentResponses = await Promise.all(assignmentPromises);
            const allAssignments = assignmentResponses.flatMap(res => res.data);
            setAssignments(allAssignments);
          } catch (err) {
            console.warn('Failed to fetch assignments:', err);
            setAssignments([]);
          }
        }

        // Fetch other data independently
        try {
          const watchTimeResponse = await axios.get('http://localhost:5000/api/videos/total-time', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setTotalWatchTime(watchTimeResponse.data.totalSeconds);
        } catch (err) {
          console.warn('Failed to fetch watch time:', err);
          setTotalWatchTime(0);
        }

        try {
          const submissionsResponse = await axios.get('http://localhost:5000/api/assignments/submissions', {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          const submissions = submissionsResponse.data;
          const scores = submissions.map((sub: any) => sub.score);
          const avgScore = scores.length > 0 
            ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length 
            : 0;
          setAverageScore(avgScore);
        } catch (err) {
          console.warn('Failed to fetch submissions:', err);
          setAverageScore(0);
        }

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        // Don't set error state here, as we're handling partial failures gracefully
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchDashboardData();
    }
  }, [token]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white p-6 rounded-xl shadow-md">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-6 bg-gray-200 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Welcome back, {user.name}!</h1>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500">Courses in Progress</h3>
            <BookOpen className="h-6 w-6 text-indigo-600" />
          </div>
          <p className="text-2xl font-bold">{enrolledCourses.length}</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500">Hours Learned</h3>
            <Clock className="h-6 w-6 text-indigo-600" />
          </div>
          <p className="text-2xl font-bold">{formatTime(totalWatchTime)}</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500">Assignments Completed</h3>
            <Award className="h-6 w-6 text-indigo-600" />
          </div>
          <p className="text-2xl font-bold">{assignments.filter(a => a.submitted).length}</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500">Average Score</h3>
            <BarChart className="h-6 w-6 text-indigo-600" />
          </div>
          <p className="text-2xl font-bold">{averageScore.toFixed(1)}%</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Current Courses */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Current Courses</h2>
              <Link to="/courses" className="text-sm text-indigo-600 hover:text-indigo-800">
                Browse more courses
              </Link>
            </div>
            
            {enrolledCourses.length > 0 ? (
              <div className="space-y-4">
                {enrolledCourses.map((course) => (
                  <div key={course._id} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{course.title}</span>
                      <span className="text-gray-500">{course.progress}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full">
                      <div 
                        className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                        style={{ width: `${course.progress}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">You haven't enrolled in any courses yet.</p>
                <Link 
                  to="/courses" 
                  className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                >
                  Browse Courses
                </Link>
              </div>
            )}
          </div>
        </div>
        
        {/* Upcoming Assignments */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-md p-6 h-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Upcoming Assignments</h2>
              <Link to="/assignments" className="text-sm text-indigo-600 hover:text-indigo-800">
                View all
              </Link>
            </div>
            
            {assignments.filter(a => !a.submitted).length > 0 ? (
              <div className="space-y-4">
                {assignments.filter(a => !a.submitted)
                  .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                  .slice(0, 3)
                  .map((assignment) => (
                    <Link 
                      to={`/assignments/${assignment._id}`}
                      key={assignment._id} 
                      className="flex items-center justify-between py-3 px-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div>
                        <h3 className="font-medium text-gray-900">{assignment.title}</h3>
                        <p className="text-sm text-gray-500">
                          {enrolledCourses.find(c => c._id === assignment.courseId)?.title || 'Unknown Course'}
                        </p>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-indigo-600 mr-1" />
                        <span className="text-sm text-indigo-600">
                          {formatDate(assignment.dueDate)}
                        </span>
                      </div>
                    </Link>
                  ))}
                <Link 
                  to="/assignments" 
                  className="block text-center text-sm text-indigo-600 hover:text-indigo-800 mt-4"
                >
                  See all assignments
                </Link>
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No upcoming assignments.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}