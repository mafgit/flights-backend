import { Request } from "express";
import createHttpError from "http-errors";

export const getIdFromParams = (req: Request) => {
  const id = Number(req.params.id);
  if (isNaN(id)) throw createHttpError(400, "Id not provided");
  return id
};
