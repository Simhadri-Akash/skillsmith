import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Play, ChevronDown, ChevronRight, Clock, Users, Award } from 'lucide-react';
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
}

interface Section {
  id: string;
  title: string;
  courseId: number;
  order: number;
}

interface Video {
  _id: string;
  title: string;
  url: string;
  duration: number;
  sectionId: string;
}

export default function Enroll() {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [enrollmentCount, setEnrollmentCount] = useState(0);
  const [enrolling, setEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const fetchCourseDetails = async () => {
      try {
        const [courseDetailsRes, enrollmentRes, enrollmentStatusRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/courses/${courseId}`),
          axios.get(`http://localhost:5000/api/courses/${courseId}/enrollments/count`),
          token ? axios.get(`http://localhost:5000/api/enrollments`, {
            headers: { Authorization: `Bearer ${token}` }
          }) : Promise.resolve({ data: [] })
        ]);

        const { course, sections, videos } = courseDetailsRes.data;
        setCourse(course);
        setSections(sections);
        setVideos(videos);
        setEnrollmentCount(enrollmentRes.data.count);

        // Check if user is already enrolled
        if (token) {
          const enrollments = enrollmentStatusRes.data;
          setIsEnrolled(enrollments.some((e: any) => e.courseId === parseInt(courseId!)));
        }
      } catch (err) {
        setError('Failed to fetch course details');
        console.error('Error fetching course details:', err);
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchCourseDetails();
    }
  }, [courseId, token]);

  const handleEnroll = async () => {
    if (!course || !token) {
      navigate('/signin');
      return;
    }

    setEnrolling(true);
    setError('');
    
    try {
      await axios.post('http://localhost:5000/api/enrollments', 
        { courseId: course._id },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      // Show success message or redirect
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to enroll in course');
      console.error('Enrollment error:', err);
    } finally {
      setEnrolling(false);
    }
  };

  const toggleSection = (sectionId: string) => {
    const newExpandedSections = new Set(expandedSections);
    if (expandedSections.has(sectionId)) {
      newExpandedSections.delete(sectionId);
    } else {
      newExpandedSections.add(sectionId);
    }
    setExpandedSections(newExpandedSections);
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    return [
      hours > 0 ? hours.toString().padStart(2, '0') : null,
      minutes.toString().padStart(2, '0'),
      remainingSeconds.toString().padStart(2, '0')
    ].filter(Boolean).join(':');
  };

  const getVideosBySection = (sectionId: string) => {
    return videos.filter(video => video.sectionId === sectionId);
  };

  const getTotalDuration = () => {
    const totalSeconds = videos.reduce((acc, video) => acc + video.duration, 0);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const getPreviewVideo = () => {
    return videos.find(video => video.sectionId === sections[0]?.id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error || 'Course not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid md:grid-cols-3 gap-8">
        {/* Course Details */}
        <div className="md:col-span-2">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{course.title}</h1>
          <p className="text-lg text-gray-600 mb-6">{course.description}</p>

          {/* Course Stats */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-4 rounded-lg shadow-sm text-center">
              <Clock className="w-6 h-6 mx-auto mb-2 text-indigo-600" />
              <p className="text-sm text-gray-600">Duration</p>
              <p className="font-semibold">{getTotalDuration()}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm text-center">
              <Users className="w-6 h-6 mx-auto mb-2 text-indigo-600" />
              <p className="text-sm text-gray-600">Students</p>
              <p className="font-semibold">{enrollmentCount}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm text-center">
              <Award className="w-6 h-6 mx-auto mb-2 text-indigo-600" />
              <p className="text-sm text-gray-600">Sections</p>
              <p className="font-semibold">{sections.length}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm text-center">
              <Play className="w-6 h-6 mx-auto mb-2 text-indigo-600" />
              <p className="text-sm text-gray-600">Videos</p>
              <p className="font-semibold">{videos.length}</p>
            </div>
          </div>

          {/* Preview Video */}
          {getPreviewVideo() && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Course Preview</h2>
              <div className="relative pt-[56.25%] bg-black rounded-lg overflow-hidden">
                <iframe
                  src={getPreviewVideo()?.url}
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            </div>
          )}

          {/* Course Content */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Course Content</h2>
            <div className="space-y-2">
              {sections.map((section) => (
                <div key={section.id} className="border rounded-lg">
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="w-full flex items-center justify-between p-3 hover:bg-gray-50"
                  >
                    <span className="font-medium">{section.title}</span>
                    {expandedSections.has(section.id) ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                  {expandedSections.has(section.id) && (
                    <div className="p-3 border-t bg-gray-50">
                      <div className="space-y-2">
                        {getVideosBySection(section.id).map((video) => (
                          <div key={video._id} className="flex items-center justify-between bg-white p-2 rounded">
                            <span className="text-sm truncate flex-1">{video.title}</span>
                            <span className="text-xs text-gray-500">{formatDuration(video.duration)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Enrollment Section */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
            <div className="text-center mb-6">
              <p className="text-3xl font-bold text-green-600 mb-2">Free</p>
              <p className="text-sm text-gray-500">Enroll now and start learning</p>
            </div>

            <div className="space-y-4 mb-6">
              <h3 className="font-semibold">What's included:</h3>
              <ul className="space-y-2">
                <li className="flex items-center text-sm">
                  <Play className="w-4 h-4 mr-2 text-green-500" />
                  {videos.length} videos
                </li>
                <li className="flex items-center text-sm">
                  <Clock className="w-4 h-4 mr-2 text-green-500" />
                  {getTotalDuration()} of content
                </li>
                <li className="flex items-center text-sm">
                  <Award className="w-4 h-4 mr-2 text-green-500" />
                  Certificate of completion
                </li>
              </ul>
            </div>

            <button
              onClick={handleEnroll}
              disabled={enrolling || isEnrolled}
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-indigo-400 flex items-center justify-center"
            >
              {enrolling ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : isEnrolled ? (
                'Already Enrolled'
              ) : (
                'Enroll Now'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}