import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, Trash2, ArrowLeft, Save } from 'lucide-react';

interface Course {
  _id: number;
  title: string;
}

interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
}

export default function CreateAssignment() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [courseId, setCourseId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [questions, setQuestions] = useState<Question[]>([
    { question: '', options: ['', '', '', ''], correctAnswer: 0 }
  ]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    // Redirect if not a teacher
    if (!token || user.role !== 'teacher') {
      navigate('/signin');
      return;
    }

    const fetchCourses = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/teacher/courses', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCourses(response.data);
        
        if (response.data.length > 0) {
          setCourseId(response.data[0]._id.toString());
        }
      } catch (err) {
        console.error('Error fetching courses:', err);
        setError('Failed to load courses. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [token, navigate, user.role]);

  const handleQuestionChange = (index: number, field: string, value: string) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
    setQuestions(updatedQuestions);
  };

  const handleOptionChange = (questionIndex: number, optionIndex: number, value: string) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].options[optionIndex] = value;
    setQuestions(updatedQuestions);
  };

  const handleCorrectAnswerChange = (questionIndex: number, optionIndex: number) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].correctAnswer = optionIndex;
    setQuestions(updatedQuestions);
  };

  const addQuestion = () => {
    setQuestions([...questions, { question: '', options: ['', '', '', ''], correctAnswer: 0 }]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      const updatedQuestions = [...questions];
      updatedQuestions.splice(index, 1);
      setQuestions(updatedQuestions);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      navigate('/signin');
      return;
    }

    // Validate form
    if (!title || !description || !courseId || !dueDate) {
      setError('Please fill in all required fields.');
      return;
    }

    // Validate questions
    for (const question of questions) {
      if (!question.question.trim()) {
        setError('All questions must have content.');
        return;
      }

      for (const option of question.options) {
        if (!option.trim()) {
          setError('All options must have content.');
          return;
        }
      }
    }

    try {
      setSubmitting(true);
      setError('');

      await axios.post(
        'http://localhost:5000/api/assignments',
        {
          title,
          description,
          courseId: parseInt(courseId),
          dueDate: new Date(dueDate).toISOString(),
          questions
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      navigate('/teacher/dashboard');
    } catch (err: any) {
      console.error('Error creating assignment:', err);
      setError(err.response?.data?.message || 'Failed to create assignment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <button
        onClick={() => navigate('/teacher/dashboard')}
        className="inline-flex items-center text-indigo-600 hover:text-indigo-800 mb-6"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back to Dashboard
      </button>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Assignment</h1>
          
          {error && (
            <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Assignment Title*
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="course" className="block text-sm font-medium text-gray-700 mb-1">
                  Course*
                </label>
                <select
                  id="course"
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                >
                  {courses.map((course) => (
                    <option key={course._id} value={course._id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description*
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
            
            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
                Due Date and Time*
              </label>
              <input
                type="datetime-local"
                id="dueDate"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
            
            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Questions</h2>
              
              <div className="space-y-8">
                {questions.map((question, qIndex) => (
                  <div key={qIndex} className="bg-gray-50 p-6 rounded-lg relative">
                    <div className="absolute top-4 right-4">
                      <button
                        type="button"
                        onClick={() => removeQuestion(qIndex)}
                        disabled={questions.length === 1}
                        className={`text-red-600 hover:text-red-800 ${
                          questions.length === 1 ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Question {qIndex + 1}*
                      </label>
                      <input
                        type="text"
                        value={question.question}
                        onChange={(e) => handleQuestionChange(qIndex, 'question', e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      />
                    </div>
                    
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-gray-700">Options*</p>
                      {question.options.map((option, oIndex) => (
                        <div key={oIndex} className="flex items-center">
                          <input
                            type="radio"
                            id={`q${qIndex}-o${oIndex}`}
                            name={`correct-answer-${qIndex}`}
                            checked={question.correctAnswer === oIndex}
                            onChange={() => handleCorrectAnswerChange(qIndex, oIndex)}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                          />
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                            className="ml-3 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder={`Option ${oIndex + 1}`}
                            required
                          />
                        </div>
                      ))}
                      <p className="text-xs text-gray-500 mt-2">
                        Select the radio button next to the correct answer.
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              <button
                type="button"
                onClick={addQuestion}
                className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Question
              </button>
            </div>
            
            <div className="flex justify-end pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/teacher/dashboard')}
                className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 mr-3"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                  submitting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Save className="mr-2 h-4 w-4" />
                {submitting ? 'Creating...' : 'Create Assignment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}