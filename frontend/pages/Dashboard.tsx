import React, { useState, useEffect } from 'react';
import { BookOpen, Clock, Award, BarChart } from 'lucide-react';
import axios from 'axios';

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
        const [
          enrollmentsResponse,
          assignmentsResponse,
          submissionsResponse,
          watchTimeResponse
        ] = await Promise.all([
          axios.get('http://localhost:5000/api/enrollments', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('http://localhost:5000/api/assignments/submissions', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('http://localhost:5000/api/assignments/submissions', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('http://localhost:5000/api/videos/total-time', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        // Process enrolled courses
        const coursePromises = enrollmentsResponse.data.map(async (enrollment: any) => {
          const courseResponse = await axios.get(`http://localhost:5000/api/courses/${enrollment.courseId}`);
          return {
            ...courseResponse.data.course,
            progress: Math.floor(Math.random() * 100) // Will be replaced with actual progress
          };
        });

        const courses = await Promise.all(coursePromises);
        setEnrolledCourses(courses);

        // Process assignments and submissions
        const submissions = submissionsResponse.data;
        const scores = submissions.map((sub: any) => sub.score);
        const avgScore = scores.length > 0 
          ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length 
          : 0;
        setAverageScore(avgScore);

        // Set total watch time
        setTotalWatchTime(watchTimeResponse.data.totalSeconds);

      } catch (err) {
        setError('Failed to fetch dashboard data');
        console.error('Error fetching dashboard data:', err);
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
      
      {/* Current Courses */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Current Courses</h2>
        <div className="space-y-4">
          {enrolledCourses.map((course) => (
            <div key={course._id} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{course.title}</span>
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
      </div>
      
      {/* Upcoming Assignments */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Upcoming Assignments</h2>
        <div className="space-y-4">
          {assignments.filter(a => !a.submitted).map((assignment) => (
            <div key={assignment._id} className="flex items-center justify-between py-2 border-b last:border-0">
              <div>
                <h3 className="font-medium">{assignment.title}</h3>
                <p className="text-sm text-gray-500">
                  {enrolledCourses.find(c => c._id === assignment.courseId)?.title}
                </p>
              </div>
              <span className="text-sm text-indigo-600">
                Due: {new Date(assignment.dueDate).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}