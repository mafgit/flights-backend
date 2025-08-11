import { z } from "zod";

export type IBookingStatus = "pending" | "cancelled" | "failed" | "confirmed";
export type ISeatClass = "economy" | "business" | "first" | "premium" | "any";

export interface ISegment {
  flight_id: number;
  seat_class: ISeatClass;
}

export interface IPassenger {
  id?: number;
  full_name: string;
  gender: "male" | "female" | "undisclosed";
  passport_number: string;
  nationality: string;
  date_of_birth: string;
  passenger_type: "adult" | "child" | "infant";
}

export interface IBooking {
  id: number;
  user_id: number;
  // booking_code: string;
  total_amount: number;
  currency: string;
  status: IBookingStatus;
  segments: ISegment[];
  passengers: IPassenger[];
  created_at: string;
  updated_at: string;
  ip_address: string;
}

export type IAddBooking = Pick<
  IBooking,
  "user_id" | "segments" | "passengers" | "ip_address"
>;

export const seatClassSchema = z.enum([
  "any",
  "economy",
  "business",
  "first",
  "premium",
]);

export const segmentSchema = z.object({
  flight_id: z.number().int().positive(),
  seat_class: seatClassSchema,
});

export const passengerSchema = z.object({
  full_name: z.string().min(3),
  gender: z.enum(["male", "female", "undisclosed"]),
  passport_number: z.string().min(6),
  nationality: z.string().min(2),
  date_of_birth: z.string().min(3),
  passenger_type: z.enum(["adult", "child", "infant"]),
});

export const addSchema = z.object({
  user_id: z.number().int().positive(),
  segments: z.array(segmentSchema).min(1).max(6),
  passengers: z.array(passengerSchema).min(1),
  ip_address: z.string().min(2), // todo: z.ipv4() etc
  // currency: z.string().min(2),
  // total_amount: z.number().positive(),
  // booking_code: z.string().min(2),
  // status: z.enum(["pending", "cancelled", "delayed", "confirmed"]),
});
