import pool from "../../database/db";
import bcrypt from "bcryptjs";
import createHttpError from "http-errors";
import { ILogin, ISignup } from "./auth.types";
import { hashPassword } from "./auth.utils";

export default class AuthService {
  async login(data: ILogin) {
    const { rows } = await pool.query("select * from users where email = $1", [
      data.email,
    ]);
    if (rows.length === 0) throw createHttpError(400, "User not found");
    const user = rows[0];
    const isMatch = await bcrypt.compare(data.password, user.password_hash);
    if (!isMatch) throw createHttpError(400, "Invalid password");
    return user;
  }

  async signup(data: ISignup) {
    const { rows } = await pool.query("select * from users where email = $1", [
      data.email,
    ]);
    if (rows.length > 0) {
      throw createHttpError(400, "User already exists");
    }

    const hashedPassword = await hashPassword(data.password);

    const results = await pool.query(
      "insert into users (full_name, email, password_hash) values ($1, $2, $3) returning *",
      [data.full_name, data.email, hashedPassword]
    );
    const user = results.rows[0];
    return user;
  }

  async getAutoBookingData(userId: number) {
    const { rows } = await pool.query(
      "select email from users where id = $1 limit 1",
      [userId]
    );
    const email = rows[0].email;

    const { rows: passengers } = await pool.query(
      "select * from passengers where added_by = $1",
      [userId]
    );

    console.log({email, passengers});
    
    return {
      email,
      passengers,
    };
  }
}
