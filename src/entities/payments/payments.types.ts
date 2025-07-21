import { z } from "zod";

type IPaymentStatus = "paid" | "pending" | "failed" | "refunded";
type IPaymentMethod =
  | "cash"
  | "credit_card"
  | "debit_card"
  | "wallet"
  | "bank_transfer";

export interface IPayment {
  id: number;
  user_id: number;
  booking_id: number;
  total_amount: number;
  method: IPaymentMethod;
  status: IPaymentStatus;
  currency: string;
}

export type IAddPayment = Omit<IPayment, "id">;

export const addSchema = z.object({
  user_id: z.number().int().positive(),
  booking_id: z.number().int().positive(),
  total_amount: z.number().positive(),
  method: z.enum([
    "cash",
    "credit_card",
    "debit_card",
    "wallet",
    "bank_transfer",
  ]),
  status: z.enum(["paid", "pending", "failed", "refunded"]),
  currency: z.string().min(2),
});
