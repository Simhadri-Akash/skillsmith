import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Search, User, BookOpen, BarChart, Clock } from 'lucide-react';

interface Student {
  _id: string;
  name: string;
  email: string;
  enrollments: Array<{
    courseId: number;
    enrolledAt: string;
    status: string;
    progress: number;
    averageScore: number;
    watchTime: number;
  }>;
}

interface Course {
  _id: number;
  title: string;
}

export default function StudentsList() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<string>('all');

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    // Redirect if not a teacher
    if (!token || user.role !== 'teacher') {
      navigate('/signin');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch courses first
        const coursesResponse = await axios.get('http://localhost:5000/api/teacher/courses', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCourses(coursesResponse.data);
        
        // For demo purposes, we'll create mock student data
        // In a real app, you would fetch this from the backend
        console.log('Courses Response:', coursesResponse.data);
        const mockStudents = generateMockStudents(coursesResponse.data);
        setStudents(mockStudents);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load student data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, navigate, user.role]);

  // Generate mock student data for demonstration
  const generateMockStudents = (courses: Course[]): Student[] => {
    const names = [
      'Emma Thompson', 'James Wilson', 'Olivia Martinez', 'Noah Johnson', 
      'Sophia Anderson', 'Liam Garcia', 'Ava Robinson', 'William Lee',
      'Isabella Clark', 'Benjamin Wright', 'Mia Lewis', 'Ethan Hall',
      'Charlotte Young', 'Alexander King', 'Amelia Scott', 'Michael Green'
    ];
    
    return Array.from({ length: 15 }, (_, i) => {
      // Assign 1-3 random courses to each student
      const numCourses = Math.floor(Math.random() * 3) + 1;
      const enrolledCourses = new Set<number>();
      
      while (enrolledCourses.size < numCourses && enrolledCourses.size < courses.length) {
        const randomCourseIndex = Math.floor(Math.random() * courses.length);
        enrolledCourses.add(courses[randomCourseIndex]._id);
      }
      
      const enrollments = Array.from(enrolledCourses).map(courseId => {
        // Generate random progress between 0-100
        const progress = Math.floor(Math.random() * 101);
        // Generate random score between 60-100
        const averageScore = Math.floor(Math.random() * 41) + 60;
        // Generate random watch time between 0-20 hours (in seconds)
        const watchTime = Math.floor(Math.random() * 72000);
        
        return {
          courseId,
          enrolledAt: new Date(Date.now() - Math.floor(Math.random() * 7776000000)).toISOString(), // Random date in last 90 days
          status: progress === 100 ? 'completed' : 'active',
          progress,
          averageScore,
          watchTime
        };
      });
      
      const name = names[i % names.length];
      const nameParts = name.split(' ');
      const email = `${nameParts[0].toLowerCase()}.${nameParts[1].toLowerCase()}@example.com`;
      
      return {
        _id: `student-${i + 1}`,
        name,
        email,
        enrollments
      };
    });
  };

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

  const getCourseTitle = (courseId: number) => {
    const course = courses.find(c => c._id === courseId);
    return course ? course.title : 'Unknown Course';
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          student.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (selectedCourse === 'all') {
      return matchesSearch;
    } else {
      return matchesSearch && student.enrollments.some(e => e.courseId.toString() === selectedCourse);
    }
  });

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <button
        onClick={() => navigate('/teacher/dashboard')}
        className="inline-flex items-center text-indigo-600 hover:text-indigo-800 mb-6"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back to Dashboard
      </button>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Students</h1>
          <p className="text-gray-600">View and manage student enrollments and progress</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div className="relative mb-4 md:mb-0 md:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            <div>
              <label htmlFor="course-filter" className="sr-only">Filter by course</label>
              <select
                id="course-filter"
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Courses</option>
                {courses.map((course) => (
                  <option key={course._id} value={course._id.toString()}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {filteredStudents.length === 0 ? (
            <div className="text-center py-12">
              <User className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
              <p className="text-gray-500">
                {searchTerm || selectedCourse !== 'all' 
                  ? 'Try adjusting your search or filter criteria' 
                  : 'No students are enrolled in your courses yet'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Course
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Enrolled On
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Progress
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg. Score
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Watch Time
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStudents.flatMap(student => 
                    student.enrollments
                      .filter(enrollment => selectedCourse === 'all' || enrollment.courseId.toString() === selectedCourse)
                      .map((enrollment, index) => (
                        <tr key={`${student._id}-${enrollment.courseId}`}>
                          {index === 0 ? (
                            <td className="px-6 py-4 whitespace-nowrap" rowSpan={student.enrollments.filter(e => selectedCourse === 'all' || e.courseId.toString() === selectedCourse).length}>
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                                  <User className="h-6 w-6 text-indigo-600" />
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">{student.name}</div>
                                  <div className="text-sm text-gray-500">{student.email}</div>
                                </div>
                              </div>
                            </td>
                          ) : null}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <BookOpen className="h-5 w-5 text-indigo-600 mr-2" />
                              <span className="text-sm text-gray-900">{getCourseTitle(enrollment.courseId)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(enrollment.enrolledAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                                <div 
                                  className="bg-indigo-600 h-2.5 rounded-full" 
                                  style={{ width: `${enrollment.progress}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-900">{enrollment.progress}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <BarChart className="h-5 w-5 text-indigo-600 mr-2" />
                              <span className="text-sm text-gray-900">{enrollment.averageScore}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Clock className="h-5 w-5 text-indigo-600 mr-2" />
                              <span className="text-sm text-gray-900">{formatTime(enrollment.watchTime)}</span>
                            </div>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}