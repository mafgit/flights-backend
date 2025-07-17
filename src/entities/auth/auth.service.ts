import pool from "../../database/db_connection";
import bcrypt from "bcryptjs";
import createHttpError from "http-errors";
import { ILogin, ISignup } from "./auth.types";

export default class AuthService {
  async login(data: ILogin) {
    const { rows } = await pool.query("select * from users where email = $1", [
      data.email,
    ]);
    if (rows.length === 0) throw createHttpError(400, "User not found");
    const user = rows[0];
    const is_match = await bcrypt.compare(data.password, user.password_hash);
    if (!is_match) throw createHttpError(400, "Invalid password");
    return user;
  }

  async signup(data: ISignup) {
    const { rows } = await pool.query("select * from users where email = $1", [
      data.email,
    ]);
    if (rows.length > 0) {
      throw createHttpError(400, "User already exists");
    }

    const hashed_password = await bcrypt.hash(data.password!, 10);

    const results = await pool.query(
      "insert into users (full_name, email, password_hash) values ($1, $2, $3) returning *",
      [data.full_name, data.email, hashed_password]
    );
    const user = results.rows[0];
    return user;
  }
}
