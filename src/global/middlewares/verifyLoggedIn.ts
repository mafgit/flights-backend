import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { MyRequest } from "../../entities/auth/auth.types";
import { IRole } from "../../entities/users/users.types";
import createHttpError from "http-errors";
import pool from "../../database/db";

const decodeAndSetUser = (req: MyRequest, token: string) => {
  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
    userId: number;
    role: IRole;
  };

  req.userId = decoded.userId;
  req.role = decoded.role;
  req.token = token;
};
export const verifyLoggedIn = (
  req: MyRequest,
  _res: Response,
  next: NextFunction
): void => {
  const { token } = req.cookies;
  if (!token) {
    return next(createHttpError(401, "Not logged in"));
  }

  decodeAndSetUser(req, token);
  next();
};

export const verifyCorrectUserOrAdmin =
  (table: string) =>
  async (req: MyRequest, res: Response, next: NextFunction) => {
    if (req.role === "admin" || req.role === "super_admin") return next();

    const idField = table === "users" ? "id" : "user_id";

    const { rows } = await pool.query(
      `select ${idField} from ${table} where id = $1`,
      [req.params.id]
    );
    if (rows[0][idField] === req.userId) next();
    else
      next(
        createHttpError(401, "You are not authorized to access this resource")
      );
  };

export const optionalLoggedIn = (
  req: MyRequest,
  _res: Response,
  next: NextFunction
): void => {
  const { token } = req.cookies;
  if (token) {
    decodeAndSetUser(req, token);
  }

  next();
};
