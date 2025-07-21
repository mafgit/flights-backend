// import {Pool} from "pg";
import { Pool } from "pg";

const pool = new Pool({
  // connectionString: DATABASE_URL
  user: process.env.DATABASE_USERNAME,
  host: process.env.DATABASE_HOST || "localhost",
  database: process.env.DATABASE_NAME || "tours",
  password: process.env.DATABASE_PASSWORD,
  port: process.env.DATABASE_PORT ? Number(process.env.DATABASE_PORT) : 5432,
});

pool
  .connect()
  .then(async (client) => {
    await pool.query("set time zone 'Asia/Karachi'");
    console.log("Connected to PostgreSQL");
    client.release();
  })
  .catch((err) => {
    console.log("Error connecting to PostgreSQL:", err);
    // process.exit(1);
  });

export default pool;
