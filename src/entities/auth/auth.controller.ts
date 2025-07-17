import { Request, Response } from "express";
import {
  sign_and_set_token,
  validate_login_body,
  validate_signup_body,
} from "./auth.utils";
import { AuthRequest } from "./auth.types";
import AuthService from "./auth.service";

const auth_service = new AuthService();

export const login = async (req: Request, res: Response): Promise<void> => {
  const parsed_body = validate_login_body(req.body);
  const user = await auth_service.login(parsed_body);
  await sign_and_set_token(user, res);
  res.json({ success: true, userId: user.id, role: user.role });
};

export const signup = async (req: Request, res: Response): Promise<void> => {
  const parsed_body = validate_signup_body(req.body);
  const user = await auth_service.signup(parsed_body);
  await sign_and_set_token(user, res);
  res.json({ userId: user.id, success: true, role: user.role });
};

export const me = async (req: AuthRequest, res: Response): Promise<void> => {
  // console.log("received me");
  res.json({ userId: req.userId, role: req.role });
};

export const logout = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  res.clearCookie("token");
  req.userId = undefined;
  req.role = undefined;
  req.token = undefined;
  res.json({ success: true });
};
