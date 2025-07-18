import { passwordSchema } from "./users.types";

export const validatePasswords = (oldPassword: string, newPassword: string) => {
  const p1 = passwordSchema.parse(newPassword);
  const p2 = passwordSchema.parse(oldPassword);
  return [p1, p2];
};
