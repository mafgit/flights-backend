import { Request, Response } from "express";
import {
  signAndSetToken,
  validateLoginBody,
  validateSignupBody,
} from "./auth.utils";
import { AuthRequest } from "./auth.types";
import AuthService from "./auth.service";

const authService = new AuthService();

export const login = async (req: Request, res: Response): Promise<void> => {
  const parsedBody = validateLoginBody(req.body);
  const user = await authService.login(parsedBody);
  await signAndSetToken(user, res);
  res.json({ success: true, userId: user.id, role: user.role });
};

export const signup = async (req: Request, res: Response): Promise<void> => {
  const parsedBody = validateSignupBody(req.body);
  const user = await authService.signup(parsedBody);
  await signAndSetToken(user, res);
  res.json({ userId: user.id, success: true, role: user.role });
};

export const me = async (req: AuthRequest, res: Response): Promise<void> => {
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
