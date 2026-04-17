const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/student', require('./routes/student'));

// Home route
app.get('/', (req, res) => {
  res.json({ message: 'Online Examination System API is running', status: 'healthy' });
});

// Database connection
const db = require('./db');

const initDB = async () => {
  try {
    const fs = require('fs');
    const path = require('path');
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    
    // Split schema into individual statements
    const statements = schema.split(';').filter(s => s.trim() !== '');
    
    for (const statement of statements) {
      await db.execute(statement);
    }
    
    console.log('Turso Database Initialized (Tables Verified)');

    // Ensure default admin exists
    const adminRes = await db.execute({
      sql: 'SELECT * FROM users WHERE email = ?',
      args: ['admin@example.com']
    });

    if (adminRes.rows.length === 0) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      await db.execute({
        sql: 'INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)',
        args: [uuidv4(), 'System Admin', 'admin@example.com', hashedPassword, 'admin']
      });
      console.log('Default Admin Account Created: admin@example.com / admin123');
    }

  } catch (err) {
    console.error('Database Initialization Failed:', err.message);
    process.exit(1);
  }
};

initDB();

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('--- GLOBAL ERROR CAUGHT ---');
  console.error('Message:', err.message);
  console.error('Stack:', err.stack);
  console.error('---------------------------');
  res.status(500).json({ 
    message: 'Internal Server Error', 
    error: process.env.NODE_ENV === 'development' ? err.message : undefined 
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
