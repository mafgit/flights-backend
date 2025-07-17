import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthRequest } from "../../entities/auth/auth.types";
import { IRole } from "../../entities/users/users.types";
import createHttpError from "http-errors";

export const verify_logged_in = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  // console.log('going through verify logged in middleware ...', req.body);

  const { token } = req.cookies;
  if (!token) {
    return next(createHttpError(401, "Not logged in"));
  }
  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
    userId: number;
    role: IRole;
  };

  req.userId = decoded.userId;
  req.role = decoded.role;
  req.token = token;
  next();
};
