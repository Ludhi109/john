const { createClient } = require('@libsql/client');
require('dotenv').config();

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

async function checkAdmin() {
  const db = createClient({
    url: url,
    authToken: authToken,
  });

  try {
    const result = await db.execute("SELECT * FROM users WHERE role = 'admin'");
    console.log('Admin Users Found:', result.rows.length);
    if (result.rows.length > 0) {
      console.log('Admins List:');
      result.rows.forEach(row => {
        console.log(`- ${row.name} (${row.email})`);
      });
    } else {
      console.log('No admin users found.');
    }
  } catch (error) {
    console.error('Error checking admin:', error);
  }
}

checkAdmin();
