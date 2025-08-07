import { Request } from "express";
import createHttpError from "http-errors";
import { z } from "zod";

export const getIdFromParams = (req: Request) => {
  const id = Number(req.params.id);
  if (isNaN(id) || id <= 0) throw createHttpError(400, "Id not provided");
  return id;
};

export const validateAddBody = <T>(schema: z.ZodObject, data: T) => {
  return schema.parse(data) as T;
};

export const validateUpdateBody = <T>(
  schema: z.ZodObject,
  data: Partial<T>
) => {
  return schema.partial().parse(data) as Partial<T>;
};