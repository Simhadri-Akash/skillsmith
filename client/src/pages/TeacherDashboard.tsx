import React, { useState, useEffect } from 'react';
import { Plus, Video, Calendar, Users, Trash2, Play, ChevronDown, ChevronRight, BookOpen, BarChart } from 'lucide-react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

interface Course {
  _id: number;
  title: string;
  description: string;
  instructor: string;
  duration: string;
  price: number;
  enrolledCount?: number;
  image?: string;
  topics?: string[];
  rating?: number;
}

interface Video {
  _id: string;
  title: string;
  resolution: string;
  duration: number;
  url: string;
  sectionId?: string;
}

interface Section {
  id: string;
  title: string;
  courseId: number;
  order: number;
}

interface DashboardStats {
  totalStudents: number;
  totalAssignments: number;
  totalVideos: number;
  totalCourses: number;
}

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [videos, setVideos] = useState<{ [key: number]: Video[] }>({});
  const [sections, setSections] = useState<{ [key: number]: Section[] }>({});
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalAssignments: 0,
    totalVideos: 0,
    totalCourses: 0
  });
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [showNewCourseModal, setShowNewCourseModal] = useState(false);
  const [showNewVideoModal, setShowNewVideoModal] = useState(false);
  const [showNewSectionModal, setShowNewSectionModal] = useState(false);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [newCourse, setNewCourse] = useState({
    title: '',
    description: '',
    duration: '',
    price: '',
    topics: '',
    image: ''
  });

  const [newVideo, setNewVideo] = useState({
    title: '',
    url: '',
    duration: '',
    resolution: '1080p',
    sectionId: ''
  });

  const [newSection, setNewSection] = useState({
    title: ''
  });

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (!token || user.role !== 'teacher') {
      navigate('/signin');
      return;
    }

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [statsResponse, coursesResponse] = await Promise.all([
          axios.get('http://localhost:5000/api/teacher/stats', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('http://localhost:5000/api/teacher/courses', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        setStats(statsResponse.data);
        setCourses(coursesResponse.data);

        // Fetch sections and videos for each course
        const coursesData = await Promise.all(coursesResponse.data.map(async (course: Course) => {
          const [sectionsResponse, videosResponse] = await Promise.all([
            axios.get(`http://localhost:5000/api/teacher/courses/${course._id}/sections`, {
              headers: { Authorization: `Bearer ${token}` }
            }),
            axios.get(`http://localhost:5000/api/teacher/courses/${course._id}/videos`, {
              headers: { Authorization: `Bearer ${token}` }
            })
          ]);

          return {
            courseId: course._id,
            sections: sectionsResponse.data,
            videos: videosResponse.data
          };
        }));

        const sectionsMap: { [key: number]: Section[] } = {};
        const videosMap: { [key: number]: Video[] } = {};
        
        coursesData.forEach(({ courseId, sections, videos }) => {
          sectionsMap[courseId] = sections;
          videosMap[courseId] = videos;
        });

        setSections(sectionsMap);
        setVideos(videosMap);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [token, navigate, user.role]);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!token) {
        navigate('/signin');
        return;
      }

      const courseData = {
        ...newCourse,
        price: parseFloat(newCourse.price) || 0,
        topics: newCourse.topics.split(',').map(topic => topic.trim()),
        rating: 0,
        _id: Date.now()
      };

      const response = await axios.post('http://localhost:5000/api/teacher/courses', courseData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setCourses(prev => [...prev, response.data]);
      setShowNewCourseModal(false);
      setNewCourse({
        title: '',
        description: '',
        duration: '',
        price: '',
        topics: '',
        image: ''
      });
    } catch (err) {
      console.error('Failed to create course:', err);
      setError('Failed to create course. Please try again.');
    }
  };

  const handleCreateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !token) return;

    try {
      const response = await axios.post(
        `http://localhost:5000/api/teacher/courses/${selectedCourse._id}/sections`,
        {
          title: newSection.title,
          courseId: selectedCourse._id,
          order: sections[selectedCourse._id]?.length || 0
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setSections(prev => ({
        ...prev,
        [selectedCourse._id]: [...(prev[selectedCourse._id] || []), response.data]
      }));
      
      setShowNewSectionModal(false);
      setNewSection({ title: '' });
    } catch (err) {
      console.error('Failed to create section:', err);
      setError('Failed to create section. Please try again.');
    }
  };

  const handleDeleteCourse = async () => {
    if (!courseToDelete || !token) return;

    try {
      await axios.delete(`http://localhost:5000/api/teacher/courses/${courseToDelete._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setCourses(prev => prev.filter(course => course._id !== courseToDelete._id));
      setShowDeleteConfirmModal(false);
      setCourseToDelete(null);
    } catch (err) {
      console.error('Failed to delete course:', err);
      setError('Failed to delete course. Please try again.');
    }
  };

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !selectedSection || !token) return;

    try {
      const videoData = {
        ...newVideo,
        duration: parseInt(newVideo.duration) || 0,
        courseId: selectedCourse._id,
        sectionId: selectedSection.id
      };

      const response = await axios.post(
        `http://localhost:5000/api/teacher/courses/${selectedCourse._id}/videos`,
        videoData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setVideos(prev => ({
        ...prev,
        [selectedCourse._id]: [...(prev[selectedCourse._id] || []), response.data]
      }));
      
      setShowNewVideoModal(false);
      setNewVideo({
        title: '',
        url: '',
        duration: '',
        resolution: '1080p',
        sectionId: ''
      });
    } catch (err) {
      console.error('Failed to add video:', err);
      setError('Failed to add video. Please try again.');
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

  const getVideosBySection = (courseId: number, sectionId: string) => {
    return videos[courseId]?.filter(video => video.sectionId === sectionId) || [];
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Teacher Dashboard</h1>
          <p className="text-gray-600">Manage your courses, content, and students</p>
        </div>
        <div className="mt-4 md:mt-0 flex flex-wrap gap-3">
          <button
            onClick={() => setShowNewCourseModal(true)}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Course
          </button>
          <Link
            to="/teacher/assignments/create"
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Assignment
          </Link>
          <Link
            to="/teacher/students"
            className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            <Users className="w-5 h-5 mr-2" />
            View Students
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
          <button 
            onClick={() => setError('')} 
            className="float-right font-bold"
          >
            &times;
          </button>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500">Total Courses</h3>
            <BookOpen className="h-6 w-6 text-indigo-600" />
          </div>
          <p className="text-2xl font-bold">{stats.totalCourses}</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500">Total Students</h3>
            <Users className="h-6 w-6 text-indigo-600" />
          </div>
          <p className="text-2xl font-bold">{stats.totalStudents}</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500">Total Videos</h3>
            <Video className="h-6 w-6 text-indigo-600" />
          </div>
          <p className="text-2xl font-bold">{stats.totalVideos}</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500">Total Assignments</h3>
            <BarChart className="h-6 w-6 text-indigo-600" />
          </div>
          <p className="text-2xl font-bold">{stats.totalAssignments}</p>
        </div>
      </div>

      {courses.length === 0 && !loading && !error ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Video className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No courses yet</h3>
          <p className="text-gray-500 mb-4">Get started by creating your first course</p>
          <button
            onClick={() => setShowNewCourseModal(true)}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Course
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div key={course._id} className="bg-white rounded-lg shadow-md overflow-hidden">
              {course.image && (
                <img 
                  src={course.image} 
                  alt={course.title} 
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-semibold">{course.title}</h3>
                  <button
                    onClick={() => {
                      setCourseToDelete(course);
                      setShowDeleteConfirmModal(true);
                    }}
                    className="text-red-600 hover:text-red-700 p-1"
                    title="Delete course"
                  >
                    <Trash2 className="w-5 w-5" />
                  </button>
                </div>
                <p className="text-gray-600 mb-4 line-clamp-2">{course.description}</p>
                
                {/* Sections */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">Course Content</h4>
                    <button
                      onClick={() => {
                        setSelectedCourse(course);
                        setShowNewSectionModal(true);
                      }}
                      className="text-sm text-indigo-600 hover:text-indigo-700"
                    >
                      Add Section
                    </button>
                  </div>
                  <div className="space-y-2">
                    {sections[course._id]?.length > 0 ? (
                      sections[course._id].map((section) => (
                        <div key={section.id} className="border rounded-lg">
                          <button
                            onClick={() => toggleSection(section.id)}
                            className="w-full flex items-center justify-between p-2 hover:bg-gray-50"
                          >
                            <span className="font-medium">{section.title}</span>
                            {expandedSections.has(section.id) ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </button>
                          {expandedSections.has(section.id) && (
                            <div className="p-2 border-t bg-gray-50">
                              <div className="space-y-2">
                                {getVideosBySection(course._id, section.id).map((video) => (
                                  <div key={video._id} className="flex items-center justify-between bg-white p-2 rounded">
                                    <span className="text-sm truncate flex-1">{video.title}</span>
                                    <div className="flex items-center space-x-2">
                                      <span className="text-xs text-gray-500">{formatDuration(video.duration)}</span>
                                      <button
                                        onClick={() => {
                                          setSelectedVideo(video);
                                          setShowVideoPlayer(true);
                                        }}
                                        className="text-indigo-600 hover:text-indigo-700"
                                        title="Play video"
                                      >
                                        <Play className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                                <button
                                  onClick={() => {
                                    setSelectedCourse(course);
                                    setSelectedSection(section);
                                    setShowNewVideoModal(true);
                                  }}
                                  className="w-full text-center text-sm text-indigo-600 hover:text-indigo-700 p-1"
                                >
                                  Add Video
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-gray-500 text-sm">
                        No sections yet. Add a section to get started.
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    <span>{course.duration}</span>
                  </div>
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    <span>{course.enrolledCount || 0} students</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Course Modal */}
      {showNewCourseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-lg w-full p-6">
            <h2 className="text-xl font-semibold mb-4">Create New Course</h2>
            <form onSubmit={handleCreateCourse}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Course Title
                  </label>
                  <input
                    type="text"
                    value={newCourse.title}
                    onChange={(e) => setNewCourse({...newCourse, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newCourse.description}
                    onChange={(e) => setNewCourse({...newCourse, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={3}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duration (e.g., "8 weeks")
                    </label>
                    <input
                      type="text"
                      value={newCourse.duration}
                      onChange={(e) => setNewCourse({...newCourse, duration: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price
                    </label>
                    <input
                      type="number"
                      value={newCourse.price}
                      onChange={(e) => setNewCourse({...newCourse, price: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Topics (comma separated)
                  </label>
                  <input
                    type="text"
                    value={newCourse.topics}
                    onChange={(e) => setNewCourse({...newCourse, topics: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="HTML, CSS, JavaScript"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Image URL
                  </label>
                  <input
                    type="url"
                    value={newCourse.image}
                    onChange={(e) => setNewCourse({...newCourse, image: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowNewCourseModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Create Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Section Modal */}
      {showNewSectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-4">Add New Section</h2>
            <form onSubmit={handleCreateSection}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Section Title
                </label>
                <input
                  type="text"
                  value={newSection.title}
                  onChange={(e) => setNewSection({...newSection, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowNewSectionModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Add Section
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Video Modal */}
      {showNewVideoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-lg w-full p-6">
            <h2 className="text-xl font-semibold mb-4">Add New Video</h2>
            <form onSubmit={handleAddVideo}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Video Title
                  </label>
                  <input
                    type="text"
                    value={newVideo.title}
                    onChange={(e) => setNewVideo({...newVideo, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Video URL (YouTube embed URL)
                  </label>
                  <input
                    type="url"
                    value={newVideo.url}
                    onChange={(e) => setNewVideo({...newVideo, url: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="https://www.youtube.com/embed/..."
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duration (seconds)
                    </label>
                    <input
                      type="number"
                      value={newVideo.duration}
                      onChange={(e) => setNewVideo({...newVideo, duration: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      min="1"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Resolution
                    </label>
                    <select
                      value={newVideo.resolution}
                      onChange={(e) => setNewVideo({...newVideo, resolution: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="720p">720p</option>
                      <option value="1080p">1080p</option>
                      <option value="1440p">1440p</option>
                      <option value="2160p">2160p</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowNewVideoModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Add Video
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Video Player Modal */}
      {showVideoPlayer && selectedVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">{selectedVideo.title}</h2>
              <button
                onClick={() => setShowVideoPlayer(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                &times;
              </button>
            </div>
            <div className="relative pt-[56.25%] bg-black rounded-lg overflow-hidden">
              <iframe
                src={selectedVideo.url}
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmModal && courseToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-4">Delete Course</h2>
            <p className="mb-6">
              Are you sure you want to delete <strong>{courseToDelete.title}</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirmModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCourse}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}