import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
  const [isOpen, setIsOpen] = React.useState(false);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  const handleSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/signin');
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <img 
                src="/skillforge-logo.png" 
                alt="Skillforge Logo" 
                className="h-8"
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden sm:flex sm:items-center sm:space-x-8">
            <Link to="/courses" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md">
              Courses
            </Link>
            {user ? (
              <>
                {user.role === 'teacher' ? (
                  <Link to="/teacher/dashboard" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md">
                    Teacher Dashboard
                  </Link>
                ) : (
                  <Link to="/dashboard" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md">
                    Dashboard
                  </Link>
                )}
                <button
                  onClick={handleSignOut}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                to="/signin"
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-700 hover:text-indigo-600"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="sm:hidden">
            <div className="pt-2 pb-3 space-y-1">
              <Link
                to="/courses"
                className="block px-3 py-2 text-gray-700 hover:text-indigo-600"
                onClick={() => setIsOpen(false)}
              >
                Courses
              </Link>
              {user ? (
                <>
                  {user.role === 'teacher' ? (
                    <Link
                      to="/teacher/dashboard"
                      className="block px-3 py-2 text-gray-700 hover:text-indigo-600"
                      onClick={() => setIsOpen(false)}
                    >
                      Teacher Dashboard
                    </Link>
                  ) : (
                    <Link
                      to="/dashboard"
                      className="block px-3 py-2 text-gray-700 hover:text-indigo-600"
                      onClick={() => setIsOpen(false)}
                    >
                      Dashboard
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      handleSignOut();
                      setIsOpen(false);
                    }}
                    className="w-full text-left bg-indigo-600 text-white px-3 py-2 rounded-md hover:bg-indigo-700"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  to="/signin"
                  className="block px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  onClick={() => setIsOpen(false)}
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}