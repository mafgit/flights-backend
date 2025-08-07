import { NextFunction, Response } from "express";
import { MyRequest } from "../../entities/auth/auth.types";
import { exchangeRates } from "../..";
import createHttpError from "http-errors";

export const getExchangeRate = async (
  req: MyRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.currency)
    return next(createHttpError(400, "Currency not provided in cookies"));
  const rate = await exchangeRates.get(req.currency);
  req.exchangeRate = rate;
  next();
};
