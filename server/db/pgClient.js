import pg from "pg"; //only use if need pg for complex queries like 

const { Pool } = pkg

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL, 
  ssl: {
    rejectUnauthorized: false, 
  },
})

export default pool