import React, { useState, useEffect } from 'react';
import { Plus, Video, Calendar, Users, Trash2, Play, ChevronDown, ChevronRight } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface Course {
  _id: number;
  title: string;
  description: string;
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

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [videos, setVideos] = useState<{ [key: number]: Video[] }>({});
  const [sections, setSections] = useState<{ [key: number]: Section[] }>({});
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
    fetchCourses();
  }, [token, navigate, user.role]);

  const fetchCourses = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/teacher/courses', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCourses(response.data);
      
      // Fetch sections and videos for each course
      const coursesData = await Promise.all(response.data.map(async (course: Course) => {
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
      setError('Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const courseData = {
        ...newCourse,
        price: parseFloat(newCourse.price),
        topics: newCourse.topics.split(',').map(topic => topic.trim()),
        rating: 0,
        _id: Date.now()
      };

      await axios.post('http://localhost:5000/api/teacher/courses', courseData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowNewCourseModal(false);
      setNewCourse({
        title: '',
        description: '',
        duration: '',
        price: '',
        topics: '',
        image: ''
      });
      fetchCourses();
    } catch (err) {
      setError('Failed to create course');
    }
  };

  const handleCreateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;

    try {
      await axios.post(
        `http://localhost:5000/api/teacher/courses/${selectedCourse._id}/sections`,
        {
          title: newSection.title,
          courseId: selectedCourse._id,
          order: sections[selectedCourse._id]?.length || 0
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowNewSectionModal(false);
      setNewSection({ title: '' });
      fetchCourses();
    } catch (err) {
      setError('Failed to create section');
    }
  };

  const handleDeleteCourse = async () => {
    if (!courseToDelete) return;

    try {
      await axios.delete(`http://localhost:5000/api/teacher/courses/${courseToDelete._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowDeleteConfirmModal(false);
      setCourseToDelete(null);
      fetchCourses();
    } catch (err) {
      setError('Failed to delete course');
    }
  };

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !selectedSection) return;

    try {
      const videoData = {
        ...newVideo,
        duration: parseInt(newVideo.duration),
        courseId: selectedCourse._id,
        sectionId: selectedSection.id
      };

      await axios.post(
        `http://localhost:5000/api/teacher/courses/${selectedCourse._id}/videos`,
        videoData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowNewVideoModal(false);
      setNewVideo({
        title: '',
        url: '',
        duration: '',
        resolution: '1080p',
        sectionId: ''
      });
      fetchCourses();
    } catch (err) {
      setError('Failed to add video');
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Teacher Dashboard</h1>
          <p className="mt-2 text-gray-600">Manage your courses and content</p>
        </div>
        <button
          onClick={() => setShowNewCourseModal(true)}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Course
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

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
                  <Trash2 className="w-5 h-5" />
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
                  {sections[course._id]?.map((section) => (
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
                                    className="p-1 text-indigo-600 hover:text-indigo-700"
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
                              className="w-full flex items-center justify-center p-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded"
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Add Video
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center text-gray-600">
                  <Users className="w-5 h-5 mr-1" />
                  <span>{course.enrolledCount || 0} students</span>
                </div>
                <div className="text-gray-600">
                  ${course.price}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {course.topics?.map((topic, index) => (
                  <span 
                    key={index}
                    className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Video Player Modal */}
      {showVideoPlayer && selectedVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-4 w-full max-w-4xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">{selectedVideo.title}</h3>
              <button
                onClick={() => {
                  setShowVideoPlayer(false);
                  setSelectedVideo(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            <div className="relative pt-[56.25%]">
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

      {/* New Course Modal */}
      {showNewCourseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Create New Course</h2>
            <form onSubmit={handleCreateCourse} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  value={newCourse.title}
                  onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={newCourse.description}
                  onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  rows={3}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Duration</label>
                <input
                  type="text"
                  value={newCourse.duration}
                  onChange={(e) => setNewCourse({ ...newCourse, duration: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., 8 weeks"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Price ($)</label>
                <input
                  type="number"
                  value={newCourse.price}
                  onChange={(e) => setNewCourse({ ...newCourse, price: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Topics (comma-separated)</label>
                <input
                  type="text"
                  value={newCourse.topics}
                  onChange={(e) => setNewCourse({ ...newCourse, topics: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., Web Design, UI/UX, Prototyping"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Image URL</label>
                <input
                  type="url"
                  value={newCourse.image}
                  onChange={(e) => setNewCourse({ ...newCourse, image: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="https://example.com/image.jpg"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewCourseModal(false)}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                >
                  Create Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Section Modal */}
      {showNewSectionModal && selectedCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Add Section to {selectedCourse.title}</h2>
            <form onSubmit={handleCreateSection} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Section Title</label>
                <input
                  type="text"
                  value={newSection.title}
                  onChange={(e) => setNewSection({ ...newSection, title: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., Introduction to the Course"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewSectionModal(false)}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                >
                  Create Section
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmModal && courseToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Delete Course</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{courseToDelete.title}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteConfirmModal(false);
                  setCourseToDelete(null);
                }}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCourse}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Delete Course
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Video Modal */}
      {showNewVideoModal && selectedCourse && selectedSection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">
              Add Video to {selectedSection.title}
            </h2>
            <form onSubmit={handleAddVideo} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  value={newVideo.title}
                  onChange={(e) => setNewVideo({ ...newVideo, title: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Video URL</label>
                <input
                  type="url"
                  value={newVideo.url}
                  onChange={(e) => setNewVideo({ ...newVideo, url: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="https://www.youtube.com/embed/VIDEO_ID"
                  required
                />
                <p className="mt-1 text-sm text-gray-500">
                  Use YouTube embed URL (e.g., https://www.youtube.com/embed/VIDEO_ID)
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Duration</label>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs text-gray-500">Hours</label>
                    <input
                      type="number"
                      min="0"
                      max="1"
                      value={Math.floor(parseInt(newVideo.duration || '0') / 3600)}
                      onChange={(e) => {
                        const hours = parseInt(e.target.value) || 0;
                        const minutes = Math.floor((parseInt(newVideo.duration || '0') % 3600) / 60);
                        const seconds = parseInt(newVideo.duration || '0') % 60;
                        const totalSeconds = (hours * 3600) + (minutes * 60) + seconds;
                        setNewVideo({ ...newVideo, duration: totalSeconds.toString() });
                      }}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Minutes</label>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={Math.floor((parseInt(newVideo.duration || '0') % 3600) / 60)}
                      onChange={(e) => {
                        const hours = Math.floor(parseInt(newVideo.duration || '0') / 3600);
                        const minutes = parseInt(e.target.value) || 0;
                        const seconds = parseInt(newVideo.duration || '0') % 60;
                        const totalSeconds = (hours * 3600) + (minutes * 60) + seconds;
                        setNewVideo({ ...newVideo, duration: totalSeconds.toString() });
                      }}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Seconds</label>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={parseInt(newVideo.duration || '0') % 60}
                      onChange={(e) => {
                        const hours = Math.floor(parseInt(newVideo.duration || '0') / 3600);
                        const minutes = Math.floor((parseInt(newVideo.duration || '0') % 3600) / 60);
                        const seconds = parseInt(e.target.value) || 0;
                        const totalSeconds = (hours * 3600) + (minutes * 60) + seconds;
                        setNewVideo({ ...newVideo, duration: totalSeconds.toString() });
                      }}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Resolution</label>
                <select
                  value={newVideo.resolution}
                  onChange={(e) => setNewVideo({ ...newVideo, resolution: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="720p">720p</option>
                  <option value="1080p">1080p</option>
                  <option value="1440p">1440p</option>
                  <option value="2160p">2160p</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewVideoModal(false)}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                >
                  Add Video
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}