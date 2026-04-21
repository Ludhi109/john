const { createClient } = require('@libsql/client');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

async function resetAdmin() {
  const db = createClient({ url, authToken });
  const email1 = 'admin@example.com';
  const email2 = 'admin@example.om'; // Case from user screenshot
  const password = 'admin123';

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update or Insert admin@example.com
    const res1 = await db.execute({
      sql: 'SELECT * FROM users WHERE email = ?',
      args: [email1]
    });

    if (res1.rows.length > 0) {
      await db.execute({
        sql: 'UPDATE users SET password = ?, role = \'admin\' WHERE email = ?',
        args: [hashedPassword, email1]
      });
      console.log(`Password updated for ${email1}`);
    } else {
      await db.execute({
        sql: 'INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)',
        args: [uuidv4(), 'System Admin', email1, hashedPassword, 'admin']
      });
      console.log(`Created admin account: ${email1}`);
    }

    // Update or Insert admin@example.om (the typo version)
    const res2 = await db.execute({
      sql: 'SELECT * FROM users WHERE email = ?',
      args: [email2]
    });

    if (res2.rows.length > 0) {
      await db.execute({
        sql: 'UPDATE users SET password = ?, role = \'admin\' WHERE email = ?',
        args: [hashedPassword, email2]
      });
      console.log(`Password updated for ${email2}`);
    } else {
      await db.execute({
        sql: 'INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)',
        args: [uuidv4(), 'System Admin (Typo)', email2, hashedPassword, 'admin']
      });
      console.log(`Created admin account for typo version: ${email2}`);
    }

  } catch (error) {
    console.error('Error resetting admin:', error);
  } finally {
    process.exit();
  }
}

resetAdmin();
