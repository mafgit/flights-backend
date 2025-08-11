import { z } from "zod";
import { validateDOB } from "../bookings/bookings.utils";
import { segmentSchema } from "../bookings/bookings.types";

export type IPaymentStatus = "paid" | "failed" | "refunded";
type IPaymentMethod =
  | "cash"
  | "credit_card"
  | "debit_card"
  | "wallet"
  | "bank_transfer";

export interface IPayment {
  id: number;
  user_id?: number;
  booking_id: number;
  total_amount: number;
  method: IPaymentMethod;
  status: IPaymentStatus;
  currency: string;
  stripe_payment_intent_id: string;
  receipt_email?: string;
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
  status: z.enum(["confirmed", "failed", "refunded"]),
  currency: z.string().min(2),
});

const passengerSchema = z
  .object({
    full_name: z.string().min(2).max(40),
    date_of_birth: z.string().min(8).max(10),
    gender: z.enum(["male", "female"]),
    passport_number: z.string().regex(/^[A-Z0-9]{6,10}$/),
    passenger_type: z.enum(["adult", "child", "infant"]),
    // nationality: z.enum(countries.map((c) => c.name)),
    nationality: z.string().min(2), // todo: enum
    id: z.number().int().min(1).optional(),
  })
  .refine(
    ({ date_of_birth, passenger_type }) => {
      return validateDOB(date_of_birth, passenger_type);
    },
    {
      error: "Invalid date of birth",
    }
  );

export const bookingAndPaymentBodySchema = z
  .object({
    user_id: z.number().int().min(1).optional(),
    // booking_id: z.number().int().min(1).optional(),
    total_amount: z.number().gt(0), // todo?: better
    segments: z.array(segmentSchema).min(1).max(6),
    passengers: z.array(passengerSchema).min(1).max(9),
    receipt_email: z.email(),
  })
  .refine(({ user_id, receipt_email }) => user_id || receipt_email);

export type IBookingAndPaymentBody = z.infer<
  typeof bookingAndPaymentBodySchema
>;
