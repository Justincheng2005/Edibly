import pg from "pg";
import dotenv from "dotenv";

const { Pool } = pg;
dotenv.config();


const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

async function testConnection() {
    let client;
    try {
      client = await pool.connect();
      console.log("Successfully connected to PostgreSQL");
      const res = await client.query('SELECT NOW()');
      console.log("Database time:", res.rows[0].now);
    } catch (err) {
      console.error("DB connection test failed (non-fatal):", err);
    } finally {
      if (client) client.release();
    }
  }
  
  testConnection(); // Call without blocking
  

export const query = (text, params) => pool.query(text, params);