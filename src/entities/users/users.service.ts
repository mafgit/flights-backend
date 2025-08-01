import { IAddUser, IRole, IUser } from "./users.types";
import pool from "../../database/db";
import BaseService from "../../global/BaseService";
import { hashPassword } from "../auth/auth.utils";
import { validatePasswords } from "./users.utils";
import { compare } from "bcryptjs";
import createHttpError from "http-errors";

export default class UsersService extends BaseService<IUser, IAddUser> {
  constructor() {
    super("users", {
      full_name: "string",
      email: "string",
      password_hash: "string",
    });
  }

  async handlePaymentIntent(data: IAddUser) {
    const hashedPassword = await hashPassword(data.password);
    const { rows } = await pool.query(
      "insert into users (full_name, email, password_hash, role) values ($1, $2, $3, $4) returning *",
      [data.full_name, data.email, hashedPassword, data.role]
    );
    return rows[0];
  }

  async updatePassword(
    userId: number,
    oldPassword: string,
    newPassword: string
  ) {
    const [p1, p2] = validatePasswords(oldPassword, newPassword);
    const { rows } = await pool.query(
      "select password_hash from users where id = $1",
      [userId]
    );
    const { password_hash } = rows[0];
    const isMatch = await compare(p1, password_hash);
    if (!isMatch) throw createHttpError(400, "Invalid password");
    const hashedPassword = await hashPassword(p2);
    const { rowCount } = await pool.query(
      "update users set password_hash = $1 where id = $2 returning *",
      [hashedPassword, userId]
    );
    return rowCount && rowCount > 0;
  }

  async updateRole(userId: number, myRole: IRole, hisNewRole: IRole) {
    // todo?: add airline_id parameter if want to add airline admins

    const { rows } = await pool.query(
      "select role from users where id = $1 for update",
      [userId]
    );
    const { role: hisOldRole } = rows[0];

    if (myRole === "admin" && hisOldRole === "super_admin")
      throw createHttpError(401, "You are not authorized");
    if (myRole === "admin" && hisNewRole === "super_admin")
      throw createHttpError(401, "You are not authorized");

    const { rowCount } = await pool.query(
      "update users set role = $1 where id = $2 returning *",
      [hisNewRole, userId]
    );
    return rowCount && rowCount > 0;
  }
}
