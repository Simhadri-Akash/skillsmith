import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Calendar, Clock, CheckCircle, ArrowLeft, AlertTriangle } from 'lucide-react';

interface Assignment {
  _id: string;
  title: string;
  description: string;
  dueDate: string;
  courseId: number;
  questions: Array<{
    question: string;
    options: string[];
    correctAnswer?: number;
  }>;
  submitted?: boolean;
  submission?: {
    answers: Array<{
      questionIndex: number;
      selectedOption: number;
    }>;
    score: number;
    submittedAt: string;
  };
}

interface Course {
  _id: number;
  title: string;
}

export default function AssignmentDetails() {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchAssignmentDetails = async () => {
      if (!token || !assignmentId) return;

      try {
        setLoading(true);
        const response = await axios.get(`http://localhost:5000/api/assignments/${assignmentId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        setAssignment(response.data);
        
        // Initialize selected answers array with -1 (nothing selected)
        if (response.data.questions && !response.data.submitted) {
          setSelectedAnswers(new Array(response.data.questions.length).fill(-1));
        }

        // Fetch course details
        try {
          const courseResponse = await axios.get(`http://localhost:5000/api/courses/${response.data.courseId}`);
          setCourse(courseResponse.data.course);
        } catch (err) {
          console.error('Error fetching course details:', err);
        }
      } catch (err) {
        console.error('Error fetching assignment details:', err);
        setError('Failed to load assignment details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchAssignmentDetails();
  }, [assignmentId, token]);

  useEffect(() => {
    // Update countdown timer
    if (!assignment || assignment.submitted) return;

    const updateTimeLeft = () => {
      const now = new Date();
      const dueDate = new Date(assignment.dueDate);
      
      if (now > dueDate) {
        setTimeLeft('Past due');
        return;
      }
      
      const diff = dueDate.getTime() - now.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h ${minutes}m remaining`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m remaining`);
      } else {
        setTimeLeft(`${minutes}m remaining`);
      }
    };
    
    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [assignment]);

  const handleAnswerSelect = (questionIndex: number, optionIndex: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[questionIndex] = optionIndex;
    setSelectedAnswers(newAnswers);
  };

  const handleSubmit = async () => {
    if (!token || !assignmentId || !assignment) return;

    // Check if all questions are answered
    if (selectedAnswers.includes(-1)) {
      alert('Please answer all questions before submitting.');
      return;
    }

    try {
      setSubmitting(true);
      
      const answers = selectedAnswers.map((selectedOption, questionIndex) => ({
        questionIndex,
        selectedOption
      }));

      await axios.post(
        `http://localhost:5000/api/assignments/${assignmentId}/submit`,
        { answers },
        { headers: { Authorization: `Bearer ${token}` }}
      );

      // Refresh assignment data to show results
      const response = await axios.get(`http://localhost:5000/api/assignments/${assignmentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setAssignment(response.data);
    } catch (err: any) {
      console.error('Error submitting assignment:', err);
      setError(err.response?.data?.message || 'Failed to submit assignment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isPastDue = (dueDate: string) => {
    return new Date() > new Date(dueDate);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white p-6 rounded-xl shadow-md">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="h-4 bg-gray-200 rounded w-full"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error || 'Assignment not found'}
        </div>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center text-indigo-600 hover:text-indigo-800 mb-6"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back to Assignments
      </button>

      <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{assignment.title}</h1>
              <p className="text-indigo-600 mb-2">{course?.title || `Course #${assignment.courseId}`}</p>
              
              <div className="flex items-center text-sm text-gray-500 mb-1">
                <Calendar className="h-4 w-4 mr-1" />
                <span>Due: {formatDate(assignment.dueDate)}</span>
              </div>
              
              {!assignment.submitted && (
                <div className="flex items-center text-sm">
                  <Clock className="h-4 w-4 mr-1 text-yellow-500" />
                  <span className={`${
                    isPastDue(assignment.dueDate) ? 'text-red-600 font-medium' : 'text-yellow-600'
                  }`}>
                    {timeLeft}
                  </span>
                </div>
              )}
            </div>
            
            {assignment.submitted && (
              <div className="mt-4 md:mt-0 bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-green-600 font-medium">Submitted</span>
                </div>
                <p className="text-sm text-gray-600 mb-1">
                  Submitted on: {formatDate(assignment.submission?.submittedAt || '')}
                </p>
                <p className="text-lg font-bold">
                  Score: {assignment.submission?.score}%
                </p>
              </div>
            )}
          </div>
          
          <div className="prose max-w-none mb-8">
            <p>{assignment.description}</p>
          </div>
          
          {isPastDue(assignment.dueDate) && !assignment.submitted && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
              <div className="flex">
                <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                <p className="text-red-700">
                  This assignment is past due. You can still submit it, but it may be marked as late.
                </p>
              </div>
            </div>
          )}
          
          <div className="space-y-8">
            {assignment.questions.map((question, qIndex) => (
              <div key={qIndex} className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Question {qIndex + 1}: {question.question}
                </h3>
                
                <div className="space-y-3">
                  {question.options.map((option, oIndex) => (
                    <div key={oIndex} className="flex items-center">
                      <input
                        type="radio"
                        id={`q${qIndex}-o${oIndex}`}
                        name={`question-${qIndex}`}
                        checked={
                          assignment.submitted
                            ? assignment.submission?.answers[qIndex]?.selectedOption === oIndex
                            : selectedAnswers[qIndex] === oIndex
                        }
                        onChange={() => handleAnswerSelect(qIndex, oIndex)}
                        disabled={assignment.submitted}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                      />
                      <label
                        htmlFor={`q${qIndex}-o${oIndex}`}
                        className={`ml-3 block ${
                          assignment.submitted && question.correctAnswer === oIndex
                            ? 'text-green-600 font-medium'
                            : assignment.submitted && 
                              assignment.submission?.answers[qIndex]?.selectedOption === oIndex && 
                              question.correctAnswer !== oIndex
                              ? 'text-red-600 font-medium'
                              : 'text-gray-700'
                        }`}
                      >
                        {option}
                        {assignment.submitted && question.correctAnswer === oIndex && (
                          <span className="ml-2 text-green-600">(Correct)</span>
                        )}
                      </label>
                    </div>
                  ))}
                </div>
                
                {assignment.submitted && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className={`text-sm ${
                      assignment.submission?.answers[qIndex]?.selectedOption === question.correctAnswer
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}>
                      {assignment.submission?.answers[qIndex]?.selectedOption === question.correctAnswer
                        ? 'Correct answer!'
                        : `Incorrect. The correct answer is: ${question.options[question.correctAnswer || 0]}`
                      }
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {!assignment.submitted && (
            <div className="mt-8 flex justify-end">
              <button
                onClick={handleSubmit}
                disabled={submitting || selectedAnswers.includes(-1)}
                className={`px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors ${
                  (submitting || selectedAnswers.includes(-1)) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {submitting ? 'Submitting...' : 'Submit Assignment'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}