import { ArrowRight, BookOpen, Users, Award } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="space-y-20">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Forge Your Future with Expert-Led Learning
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-indigo-100">
              Master new skills with our comprehensive online learning platform
            </p>
            <div className="flex justify-center space-x-4">
              <Link
                to="/courses"
                className="bg-white text-indigo-600 px-8 py-3 rounded-lg font-semibold hover:bg-indigo-50 transition-colors"
              >
                Explore Courses
              </Link>
              <button className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-indigo-600 transition-colors">
                Try for Free
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose Skill Forge?</h2>
          <p className="text-xl text-gray-600">Discover the features that make us stand out</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 bg-white rounded-xl shadow-md">
            <BookOpen className="h-12 w-12 text-indigo-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Expert-Led Courses</h3>
            <p className="text-gray-600">Learn from industry professionals with real-world experience</p>
          </div>

          <div className="p-6 bg-white rounded-xl shadow-md">
            <Users className="h-12 w-12 text-indigo-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Interactive Learning</h3>
            <p className="text-gray-600">Engage with peers and instructors in real-time discussions</p>
          </div>

          <div className="p-6 bg-white rounded-xl shadow-md">
            <Award className="h-12 w-12 text-indigo-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Verified Certificates</h3>
            <p className="text-gray-600">Earn recognized certificates upon course completion</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Start Learning?</h2>
            <p className="text-xl text-gray-300 mb-8">
              Join thousands of learners already learning with Skill Forge
            </p>
            <Link
              to="/courses"
              className="inline-flex items-center bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              Get Started <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}