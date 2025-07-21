import { z } from "zod";

export type IRole = "admin" | "user" | "super_admin";

export interface IUser {
  id: number;
  full_name: string;
  email: string;
  password_hash: string;
  password: string;
  role: IRole;
  created_at: string;
  updated_at: string;
}

export type IAddUser = Pick<IUser, "full_name" | "email" | "password" | "role">;

export const passwordSchema = z.string().min(3);

export const addSchema = z.object({
  full_name: z.string().min(3),
  email: z.email(),
  role: z.enum(["user", "admin", "super_admin"]),
  password: passwordSchema,
});
