import { Response, NextFunction } from "express";
import { MyRequest } from "../../entities/auth/auth.types";
import createHttpError from 'http-errors'

export const verifyAdmin = (
  req: MyRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.userId || (req.role !== "admin" && req.role !== "super_admin"))
    return next(createHttpError(401, "Not a admin"))
  next();
};

export const verifySuperAdmin = (
  req: MyRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.userId || req.role !== "super_admin")
    return next(createHttpError(401, "Not a super admin"))
  next();
};
