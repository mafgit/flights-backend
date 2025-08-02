import { NextFunction, Response } from "express";
import { HttpError } from "http-errors";
import { flattenError, prettifyError, ZodError } from "zod";
import { MyRequest } from "../../entities/auth/auth.types";

export const errorHandler = (
  err: HttpError | ZodError,
  req: MyRequest,
  res: Response,
  _next: NextFunction
) => {
  console.error('----------------------------------------------------')
  if (err instanceof ZodError) {
    console.error(`ZodError on ${req.originalUrl}`, prettifyError(err));
    res.status(400).json({ success: false, error: flattenError(err) });
  } else {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    // console.error(`HttpError on '${req.originalUrl}' (${status}): ${message}`);
    console.error(err);
    res.status(status).json({ success: false, error: message });
  }
};
