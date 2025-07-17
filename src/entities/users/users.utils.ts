import { z } from "zod";
import { IAddUser, IUser } from "./users.types";

const passwordSchema = z.string().min(3);

const schema = z.object({
  full_name: z.string().min(3),
  email: z.email(),
  role: z.enum(["user", "admin", "super_admin"]),
  password: passwordSchema,
});

export const validateAddBody = (data: IAddUser) => {
  return schema.parse(data);
};

export const validateUpdateBody = (data: Partial<IUser>) => {
  return schema.partial().parse(data);
};

export const validatePasswords = (oldPassword: string, newPassword: string) => {
  const p1 = passwordSchema.parse(newPassword);
  const p2 = passwordSchema.parse(oldPassword);
  return [p1, p2];
};
