import { useState, useEffect } from 'react';
import { BookOpen, Clock, Star, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
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
  price: number;
}

export default function Courses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollmentCounts, setEnrollmentCounts] = useState<{[key: number]: number}>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/courses');
        setCourses(response.data);
        
        // Fetch enrollment counts for each course
        const counts = await Promise.all(
          response.data.map(async (course: Course) => {
            const countResponse = await axios.get(`http://localhost:5000/api/courses/${course._id}/enrollments/count`);
            return { id: course._id, count: countResponse.data.count };
          })
        );
        
        const countsMap = counts.reduce((acc, { id, count }) => {
          acc[id] = count;
          return acc;
        }, {});
        
        setEnrollmentCounts(countsMap);
      } catch (error) {
        setError('Failed to fetch courses');
        console.error('Error fetching courses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse space-y-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="h-64 bg-gray-200"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Available Courses</h1>
        <p className="text-xl text-gray-600">Expand your knowledge with our expert-led courses</p>
      </div>

      <div className="space-y-8">
        {courses.map((course) => (
          <div key={course._id} className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="grid md:grid-cols-2 gap-0">
              <div className="h-64 md:h-auto">
                <img 
                  src={course.image} 
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">{course.title}</h2>
                  <span className="flex items-center text-yellow-500">
                    <Star className="h-5 w-5 fill-current" />
                    <span className="ml-1 text-lg">{course.rating}</span>
                  </span>
                </div>
                
                <p className="text-gray-600 mb-6">{course.description}</p>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center text-gray-600">
                    <BookOpen className="h-5 w-5 mr-2" />
                    <span>{course.instructor}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Clock className="h-5 w-5 mr-2" />
                    <span>{course.duration}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Users className="h-5 w-5 mr-2" />
                    <span>{enrollmentCounts[course._id] || 0} enrolled</span>
                  </div>
                  <div className="flex items-center text-gray-900 font-bold">
                    <span>${course.price}</span>
                  </div>
                </div>
                
                <div className="mb-6">
                  <h3 className="font-semibold mb-2">What you'll learn:</h3>
                  <ul className="grid grid-cols-2 gap-2">
                    {course.topics.map((topic, index) => (
                      <li key={index} className="flex items-center text-gray-600">
                        <span className="w-2 h-2 bg-indigo-600 rounded-full mr-2"></span>
                        {topic}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <Link 
                  to={`/enroll/${course._id}`}
                  className="block w-full bg-indigo-600 text-white text-center py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Enroll Now
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}