import { Response } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { IUser } from "../users/users.types";
import { ILogin, ISignup } from "./auth.types";

export const validate_signup_body = (data: ISignup) => {
  const bodySchema = z.object({
    email: z.email(),
    password: z.string().min(3),
    full_name: z.string().min(3),
  });
  const parsed_body = bodySchema.parse(data);
  return parsed_body;
};

export const validate_login_body = (data: ILogin) => {
  const bodySchema = z.object({
    email: z.email(),
    password: z.string().min(3),
  });
  const parsed_body = bodySchema.parse(data);
  return parsed_body;
};

export const sign_and_set_token = async (user: Pick<IUser, "id" | "role">, res: Response) => {
  const token = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: "1d" }
  );

  const maxAge = 24 * 60 * 60 * 1000;
  res.cookie("token", token, {
    httpOnly: true,
    maxAge,
    sameSite: "lax",
    secure: false,
  });

  // if any error
  // throw createHttpError(400, "User already exists");

  return token;
};
