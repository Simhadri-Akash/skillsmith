import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Calendar, Clock, CheckCircle, XCircle, ArrowRight } from 'lucide-react';

interface Assignment {
  _id: string;
  title: string;
  description: string;
  dueDate: string;
  courseId: number;
  submitted?: boolean;
  score?: number | null;
}

interface Course {
  _id: number;
  title: string;
}

export default function Assignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'completed'

  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchAssignments = async () => {
      if (!token) return;

      try {
        setLoading(true);
        
        // First get enrollments
        const enrollmentsResponse = await axios.get('http://localhost:5000/api/enrollments', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (enrollmentsResponse.data.length === 0) {
          setAssignments([]);
          setLoading(false);
          return;
        }

        // Get courses for the enrollments
        const courseIds = enrollmentsResponse.data.map((enrollment: any) => enrollment.courseId);
        const coursePromises = courseIds.map((courseId: number) => 
          axios.get(`http://localhost:5000/api/courses/${courseId}`)
        );
        
        const courseResponses = await Promise.all(coursePromises);
        const coursesData = courseResponses.map(res => res.data.course);
        setCourses(coursesData);

        // Get assignments for each course
        const assignmentPromises = courseIds.map((courseId: number) => 
          axios.get(`http://localhost:5000/api/assignments/course/${courseId}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        );

        const assignmentResponses = await Promise.all(assignmentPromises);
        const allAssignments = assignmentResponses.flatMap(res => res.data);
        
        setAssignments(allAssignments);
      } catch (err) {
        console.error('Error fetching assignments:', err);
        setError('Failed to load assignments. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, [token]);

  const getCourseTitle = (courseId: number) => {
    const course = courses.find(c => c._id === courseId);
    return course ? course.title : 'Unknown Course';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const isPastDue = (dueDate: string) => {
    return new Date() > new Date(dueDate);
  };

  const filteredAssignments = assignments.filter(assignment => {
    if (filter === 'pending') return !assignment.submitted;
    if (filter === 'completed') return assignment.submitted;
    return true;
  });

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Assignments</h1>
          <p className="text-gray-600">Manage and track your course assignments</p>
        </div>
        
        <div className="mt-4 md:mt-0">
          <div className="inline-flex rounded-md shadow-sm">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 text-sm font-medium rounded-l-md ${
                filter === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              } border border-gray-300`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 text-sm font-medium ${
                filter === 'pending'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              } border-t border-b border-gray-300`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 text-sm font-medium rounded-r-md ${
                filter === 'completed'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              } border border-gray-300`}
            >
              Completed
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {filteredAssignments.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">No assignments found</h3>
          <p className="text-gray-500 mb-6">
            {filter === 'all' 
              ? "You don't have any assignments yet." 
              : filter === 'pending' 
                ? "You don't have any pending assignments." 
                : "You haven't completed any assignments yet."}
          </p>
          {filter !== 'all' && (
            <button
              onClick={() => setFilter('all')}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              View all assignments
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {filteredAssignments
            .sort((a, b) => {
              // Sort by submitted status first, then by due date
              if (a.submitted !== b.submitted) {
                return a.submitted ? 1 : -1;
              }
              return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
            })
            .map((assignment) => (
              <div 
                key={assignment._id} 
                className={`bg-white rounded-xl shadow-md overflow-hidden border-l-4 ${
                  assignment.submitted 
                    ? 'border-green-500' 
                    : isPastDue(assignment.dueDate) 
                      ? 'border-red-500' 
                      : 'border-yellow-500'
                }`}
              >
                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div className="mb-4 md:mb-0">
                      <h2 className="text-xl font-semibold text-gray-900 mb-1">{assignment.title}</h2>
                      <p className="text-gray-600 mb-2">{getCourseTitle(assignment.courseId)}</p>
                      <div className="flex items-center text-sm">
                        <Calendar className="h-4 w-4 text-gray-500 mr-1" />
                        <span className={`${
                          isPastDue(assignment.dueDate) && !assignment.submitted 
                            ? 'text-red-600 font-medium' 
                            : 'text-gray-500'
                        }`}>
                          Due: {formatDate(assignment.dueDate)}
                          {isPastDue(assignment.dueDate) && !assignment.submitted && ' (Past due)'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col md:items-end">
                      <div className="flex items-center mb-3">
                        {assignment.submitted ? (
                          <>
                            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                            <span className="text-green-600 font-medium">Completed</span>
                          </>
                        ) : isPastDue(assignment.dueDate) ? (
                          <>
                            <XCircle className="h-5 w-5 text-red-500 mr-2" />
                            <span className="text-red-600 font-medium">Missed</span>
                          </>
                        ) : (
                          <>
                            <Clock className="h-5 w-5 text-yellow-500 mr-2" />
                            <span className="text-yellow-600 font-medium">Pending</span>
                          </>
                        )}
                      </div>
                      
                      {assignment.submitted && assignment.score !== null && (
                        <div className="text-gray-700 font-medium mb-3">
                          Score: {assignment.score}%
                        </div>
                      )}
                      
                      <Link
                        to={`/assignments/${assignment._id}`}
                        className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                      >
                        {assignment.submitted ? 'View Submission' : 'Start Assignment'}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}