import { Response, NextFunction } from "express";
import { AuthRequest } from "../../entities/auth/auth.types";
import createHttpError from 'http-errors'

export const verify_admin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.userId || (req.role !== "admin" && req.role !== "super_admin"))
    return next(createHttpError(401, "Not a super admin"))
  next();
};

export const verifySuperAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.userId || req.role !== "super_admin")
    return next(createHttpError(401, "Not a super admin"))
  next();
};
