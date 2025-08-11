import { Response } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { IUser } from "../users/users.types";
import { ILogin, ISignup } from "./auth.types";
import { hash } from "bcryptjs";

export const validateSignupBody = (data: ISignup) => {
  const bodySchema = z.object({
    email: z.email(),
    password: z.string().min(3),
    full_name: z.string().min(3),
  });
  const parsedBody = bodySchema.parse(data);
  return parsedBody;
};

export const validateLoginBody = (data: ILogin) => {
  const bodySchema = z.object({
    email: z.email(),
    password: z.string().min(3),
  });
  const parsedBody = bodySchema.parse(data);
  return parsedBody;
};

export const signAndSetToken = async (
  user: Pick<IUser, "id" | "role">,
  res: Response
) => {
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
    secure: process.env.NODE_ENV === "production",
  });

  // if any error
  // throw createHttpError(400, "User already exists");

  return token;
};

export const hashPassword = async (password: string) => {
  return await hash(password, parseInt(process.env.SALT_ROUNDS!) || 10);
};
