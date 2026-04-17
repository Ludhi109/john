# Online Examination System | Premium Assessment Platform

A production-ready, full-stack online examination platform built with **Next.js**, **Node.js**, **Express**, and **MongoDB**.

## ✨ Key Features

- **Admin Module**: Complete CRUD for exams and questions.
- **Question Types**: MCQ, Short Answer, and **Coding Questions** (with test cases).
- **Security Engine**: Anti-cheat mechanisms including tab-switch detection, fullscreen enforcement, and inactivity timer.
- **Smart Evaluation**: Auto-grading for MCQs and keyword-based evaluation for text answers.
- **Real-time Leaderboard**: Instant rank updates and score distribution analytics.
- **Modern UI**: Dark-themed, responsive, and high-performance frontend.

## 🛠️ Tech Stack

- **Frontend**: React (Next.js), Tailwind CSS, Lucide Icons, Zustand.
- **Backend**: Node.js, Express, MongoDB (Mongoose).
- **Security**: JWT-based authentication.
- **Code Execution**: Integrated Monaco Editor with Judge0 API (supports Mock Fallback).

## 🚀 Quick Start (Local)

### 1. Prerequisite
- Node.js v20+
- MongoDB (or use the built-in Mock Fallback)

### 2. Backend Setup
```bash
cd backend
npm install
npm start
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 4. Admin Credentials
- **Email**: `admin@example.com`
- **Password**: `admin123`
(Use the **"Quick Seed"** button in the Admin Dashboard to populate data).

## 🐳 Docker Deployment

Run the entire stack with a single command:
```bash
docker-compose up --build
```

## 🧪 Testing

Run backend unit tests:
```bash
cd backend
npm test
```

## 📄 License
MIT License. Engineered for Excellence.
