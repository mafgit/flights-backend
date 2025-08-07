import { NextFunction, Response } from "express";
import { MyRequest } from "../../entities/auth/auth.types";
import { exchangeRates } from "../..";

export const getExchangeRate = async (
  req: MyRequest,
  res: Response,
  next: NextFunction
) => {
  const rate = await exchangeRates.get(req.currency);
  req.exchangeRate = rate;
  next();
};
