const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./src/models/User');
const Exam = require('./src/models/Exam');
const Question = require('./src/models/Question');
const Attempt = require('./src/models/Attempt');


const seed = async () => {
  try {
    const connStr = process.env.MONGO_URI || 'mongodb://localhost:27017/online-quiz';
    try {
      await mongoose.connect(connStr);
      console.log(`MongoDB Connected: ${connStr}`);
    } catch (err) {
      console.log('Local MongoDB not found. Using In-Memory Mock Database for seeding...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create();
      const mongoUri = mongoServer.getUri();
      await mongoose.connect(mongoUri);
      console.log(`In-Memory MongoDB Started at: ${mongoUri}`);
    }


    // Clear existing users
    await User.deleteMany({});

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'admin'
    });

    const student1 = await User.create({
      name: 'Student User',
      email: 'student@example.com',
      password: hashedPassword,
      role: 'student'
    });

    const student2 = await User.create({
      name: 'John Doe',
      email: 'john@example.com',
      password: hashedPassword,
      role: 'student'
    });

    // Create Sample Exam
    const exam = await Exam.create({
      title: 'Full-Stack Mastery Challenge',
      description: 'A comprehensive evaluation of modern web development skills, covering React, Node.js, and Algorithms.',
      duration: 30,
      attemptLimit: 1,
      createdBy: admin._id,
      randomize: true
    });

    // Create Sample Questions
    const questions = await Question.create([
      {
        exam: exam._id,
        type: 'MCQ',
        content: 'Which React hook is used for side effects?',
        options: ['useState', 'useEffect', 'useContext', 'useReducer'],
        answer: 'useEffect',
        points: 10
      },
      {
        exam: exam._id,
        type: 'MCQ',
        content: 'What is the default port for an Express server?',
        options: ['3000', '5000', '8000', '8080'],
        answer: '3000',
        points: 10
      },
      {
        exam: exam._id,
        type: 'short-answer',
        content: 'What does JWT stand for?',
        answer: 'JSON Web Token',
        keywords: ['JSON', 'Web', 'Token'],
        points: 20
      },
      {
        exam: exam._id,
        type: 'coding',
        content: 'Write a function "sum(a, b)" that returns the sum of two numbers.',
        answer: 'function sum(a, b) { return a + b; }',
        testCases: [
          { input: '2, 3', output: '5' },
          { input: '-1, 1', output: '0' }
        ],
        points: 60
      }
    ]);

    // Create Sample Attempts for Analytics
    await Attempt.create([
      {
        user: student1._id,
        exam: exam._id,
        score: 85,
        status: 'completed',
        startTime: new Date(Date.now() - 3600000),
        endTime: new Date(Date.now() - 3000000)
      },
      {
        user: student2._id,
        exam: exam._id,
        score: 45,
        status: 'completed',
        startTime: new Date(Date.now() - 7200000),
        endTime: new Date(Date.now() - 6600000)
      }
    ]);

    console.log('Database Seeded Successfully!');
    console.log('---------------------------');
    console.log('Admin: admin@example.com / admin123');
    console.log('Student 1: student@example.com / admin123');
    console.log('Student 2: john@example.com / admin123');
    console.log('---------------------------');

    
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seed();
