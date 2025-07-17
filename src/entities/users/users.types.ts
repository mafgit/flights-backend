export type IRole = "admin" | "user" | "super_admin";

export interface IUser {
  id: number;
  full_name: string;
  email: string;
  password_hash: string;
  password: string;
  role: IRole;
}