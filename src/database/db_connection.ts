// import {Pool} from "pg";
import pkg from "pg";
const { Pool } = pkg;

// console.log('\n\n\n',process.env.DATABASE_USERNAME);

// const DATABASE_URL = process.env.DATABASE_URL;
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
  .then((client) => {
    console.log("Connected to PostgreSQL");
    client.release();
  })
  .catch((err) => {
    console.log("Error connecting to PostgreSQL:", err);
    // process.exit(1);
  });

export default pool;
