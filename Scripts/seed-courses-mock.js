import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

// Sample course data
const courses = [
  {
    _id: 1,
    title: "Web Development Fundamentals",
    description: "Learn the core technologies that power the web: HTML, CSS, and JavaScript. This comprehensive course takes you from the basics to building responsive websites.",
    instructor: "Sarah Johnson",
    duration: "8 weeks",
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2072&q=80",
    topics: ["HTML", "CSS", "JavaScript", "Responsive Design"],
    price: 0
  },
  {
    _id: 2,
    title: "React.js for Beginners",
    description: "Master React.js, the popular JavaScript library for building user interfaces. Learn component-based architecture, state management, and modern React patterns.",
    instructor: "Michael Chen",
    duration: "10 weeks",
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
    topics: ["React", "JSX", "Hooks", "Context API", "Redux"],
    price: 0
  },
  {
    _id: 3,
    title: "Node.js Backend Development",
    description: "Build scalable and robust backend systems with Node.js. Learn server-side JavaScript, RESTful APIs, database integration, and deployment strategies.",
    instructor: "Alex Rodriguez",
    duration: "12 weeks",
    rating: 4.7,
    image: "https://images.unsplash.com/photo-1627398242454-45a1465c2479?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2074&q=80",
    topics: ["Node.js", "Express", "MongoDB", "RESTful APIs", "Authentication"],
    price: 0
  }
];

// Sample sections data
const sections = [
  // Course 1 sections
  {
    id: uuidv4(),
    title: "Introduction to HTML",
    courseId: 1,
    order: 1
  },
  {
    id: uuidv4(),
    title: "CSS Styling Basics",
    courseId: 1,
    order: 2
  },
  {
    id: uuidv4(),
    title: "JavaScript Fundamentals",
    courseId: 1,
    order: 3
  },
  // Course 2 sections
  {
    id: uuidv4(),
    title: "React Basics",
    courseId: 2,
    order: 1
  },
  {
    id: uuidv4(),
    title: "Working with Components",
    courseId: 2,
    order: 2
  },
  {
    id: uuidv4(),
    title: "State and Hooks",
    courseId: 2,
    order: 3
  },
  // Course 3 sections
  {
    id: uuidv4(),
    title: "Node.js Introduction",
    courseId: 3,
    order: 1
  },
  {
    id: uuidv4(),
    title: "Express Framework",
    courseId: 3,
    order: 2
  },
  {
    id: uuidv4(),
    title: "Database Integration",
    courseId: 3,
    order: 3
  }
];

// Sample videos data
const videos = [
  // Course 1, Section 1 videos
  {
    title: "HTML Document Structure",
    description: "Learn the basic structure of an HTML document and how to create your first webpage.",
    url: "https://www.youtube.com/embed/UB1O30fR-EE",
    duration: 720, // 12 minutes
    resolution: "1080p",
    sectionId: sections[0].id,
    courseId: 1,
    order: 1
  },
  {
    title: "Working with HTML Tags",
    description: "Explore the most common HTML tags and how to use them effectively.",
    url: "https://www.youtube.com/embed/DPnqb74Smug",
    duration: 840, // 14 minutes
    resolution: "1080p",
    sectionId: sections[0].id,
    courseId: 1,
    order: 2
  },
  // Course 1, Section 2 videos
  {
    title: "CSS Selectors",
    description: "Master CSS selectors to target and style HTML elements.",
    url: "https://www.youtube.com/embed/l1mER1bV0N0",
    duration: 780, // 13 minutes
    resolution: "1080p",
    sectionId: sections[1].id,
    courseId: 1,
    order: 1
  },
  {
    title: "CSS Box Model",
    description: "Understand the CSS box model and how it affects layout.",
    url: "https://www.youtube.com/embed/rIO5326FgPE",
    duration: 660, // 11 minutes
    resolution: "1080p",
    sectionId: sections[1].id,
    courseId: 1,
    order: 2
  },
  // Course 2, Section 1 videos
  {
    title: "Introduction to React",
    description: "Learn what React is and why it's so popular for building user interfaces.",
    url: "https://www.youtube.com/embed/Tn6-PIqc4UM",
    duration: 900, // 15 minutes
    resolution: "1080p",
    sectionId: sections[3].id,
    courseId: 2,
    order: 1
  },
  {
    title: "Setting Up Your React Environment",
    description: "Set up your development environment for React projects.",
    url: "https://www.youtube.com/embed/w7ejDZ8SWv8",
    duration: 780, // 13 minutes
    resolution: "1080p",
    sectionId: sections[3].id,
    courseId: 2,
    order: 2
  },
  // Course 3, Section 1 videos
  {
    title: "What is Node.js?",
    description: "Understand what Node.js is and how it enables JavaScript on the server.",
    url: "https://www.youtube.com/embed/uVwtVBpw7RQ",
    duration: 840, // 14 minutes
    resolution: "1080p",
    sectionId: sections[6].id,
    courseId: 3,
    order: 1
  },
  {
    title: "Installing Node.js and NPM",
    description: "Learn how to install Node.js and NPM on your system.",
    url: "https://www.youtube.com/embed/3F5IaPqj7ds",
    duration: 720, // 12 minutes
    resolution: "1080p",
    sectionId: sections[6].id,
    courseId: 3,
    order: 2
  }
];

// Create mock data directory if it doesn't exist
const mockDataDir = path.join(process.cwd(), 'mock-data');
if (!fs.existsSync(mockDataDir)) {
  fs.mkdirSync(mockDataDir);
}

// Write mock data to JSON files
fs.writeFileSync(path.join(mockDataDir, 'courses.json'), JSON.stringify(courses, null, 2));
fs.writeFileSync(path.join(mockDataDir, 'sections.json'), JSON.stringify(sections, null, 2));
fs.writeFileSync(path.join(mockDataDir, 'videos.json'), JSON.stringify(videos, null, 2));

console.log('Mock data files created successfully in the mock-data directory!');