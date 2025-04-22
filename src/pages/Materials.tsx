import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { FileText, Download, Trash2, Upload, Plus } from 'lucide-react';

interface Material {
  _id: string;
  title: string;
  description: string;
  fileUrl: string;
  fileType: string;
  uploadedBy: {
    name: string;
  };
  uploadedAt: string;
}

export default function Materials() {
  const { courseId } = useParams<{ courseId: string }>();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newMaterial, setNewMaterial] = useState({
    title: '',
    description: '',
    fileUrl: '',
    fileType: 'pdf'
  });

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isTeacher = user.role === 'teacher';

  useEffect(() => {
    fetchMaterials();
  }, [courseId]);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/api/materials/course/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMaterials(response.data);
    } catch (err) {
      console.error('Error fetching materials:', err);
      setError('Failed to load materials');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/materials', {
        ...newMaterial,
        courseId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setShowUploadModal(false);
      setNewMaterial({
        title: '',
        description: '',
        fileUrl: '',
        fileType: 'pdf'
      });
      fetchMaterials();
    } catch (err) {
      console.error('Error uploading material:', err);
      setError('Failed to upload material');
    }
  };

  const handleDelete = async (materialId: string) => {
    if (!confirm('Are you sure you want to delete this material?')) return;

    try {
      await axios.delete(`http://localhost:5000/api/materials/${materialId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchMaterials();
    } catch (err) {
      console.error('Error deleting material:', err);
      setError('Failed to delete material');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
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
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Course Materials</h1>
          <p className="text-gray-600 mt-2">Access course documents and resources</p>
        </div>
        {isTeacher && (
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            <Plus className="w-5 h-5 mr-2" />
            Upload Material
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {materials.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No materials yet</h3>
          <p className="text-gray-500">
            {isTeacher 
              ? "Start by uploading course materials for your students."
              : "No materials have been uploaded for this course yet."}
          </p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {materials.map((material) => (
              <li key={material._id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-gray-400" />
                      <p className="ml-2 text-sm font-medium text-indigo-600 truncate">
                        {material.title}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <a
                        href={material.fileUrl}
                        download
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </a>
                      {isTeacher && (
                        <button
                          onClick={() => handleDelete(material._id)}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-gray-500">
                        {material.description}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                      <p>
                        Uploaded by {material.uploadedBy.name} on {formatDate(material.uploadedAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-4">Upload Material</h2>
            <form onSubmit={handleUpload}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={newMaterial.title}
                    onChange={(e) => setNewMaterial({ ...newMaterial, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newMaterial.description}
                    onChange={(e) => setNewMaterial({ ...newMaterial, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    File URL
                  </label>
                  <input
                    type="url"
                    value={newMaterial.fileUrl}
                    onChange={(e) => setNewMaterial({ ...newMaterial, fileUrl: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    File Type
                  </label>
                  <select
                    value={newMaterial.fileType}
                    onChange={(e) => setNewMaterial({ ...newMaterial, fileType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="pdf">PDF</option>
                    <option value="doc">Word Document</option>
                    <option value="ppt">PowerPoint</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Upload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
