import 'dotenv/config';
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'sik',
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
  // Timezone WIB
  timezone: '+07:00',
  // Return dates as strings, not Date objects (avoid timezone bugs)
  dateStrings: true,
});

export default pool;
