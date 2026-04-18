const { createClient } = require('@libsql/client');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

async function createAdmin(name, email, password) {
  const db = createClient({
    url: url,
    authToken: authToken,
  });

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const userId = uuidv4();

    await db.execute({
      sql: 'INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)',
      args: [userId, name, email, hashedPassword, 'admin']
    });

    console.log(`Admin created successfully: ${email}`);
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      console.log(`User with email ${email} already exists.`);
    } else {
      console.error('Error creating admin:', error);
    }
  }
}

// Example usage: node create_admin.js "My Admin" "myadmin@example.com" "password123"
const args = process.argv.slice(2);
if (args.length === 3) {
  createAdmin(args[0], args[1], args[2]);
} else {
  console.log('Usage: node create_admin.js <name> <email> <password>');
  console.log('Defaulting to checking if admin@example.com exists...');
  
  const db = createClient({ url, authToken });
  db.execute({
    sql: 'SELECT * FROM users WHERE email = ?',
    args: ['admin@example.com']
  }).then(res => {
    if (res.rows.length === 0) {
      createAdmin('System Admin', 'admin@example.com', 'admin123');
    } else {
      console.log('Admin admin@example.com already exists.');
    }
  });
}
