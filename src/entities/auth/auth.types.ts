import { Request } from "express";
import { IRole, IUser } from "../users/users.types";

export interface MyRequest extends Request {
  userId?: number;
  role?: IRole;
  token?: string;

  city?: string;
  currency?: string;
  timezone?: string;
  country?: string;
  country_name?: string;
}

export type ILogin = Pick<IUser, "email" | "password">;
export type ISignup = Pick<IUser, "email" | "password" | "full_name">;
