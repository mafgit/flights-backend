import { z } from "zod";

export type IStatus = "pending" | "cancelled" | "delayed" | "completed";
export type ISeatClass = "economy" | "business" | "first" | "premium";

export interface ISegment {
  flight_id: number;
  seat_class: ISeatClass;
}

export interface IPassenger {
  full_name: string;
  gender: "m" | "f" | "x";
  passport_number: string;
  nationality: string;
  date_of_birth: string;
}

export interface IBooking {
  id: number;
  user_id: number;
  // booking_code: string;
  total_amount: number;
  currency: string;
  status: IStatus;
  segments: ISegment[];
  passengers: IPassenger[];
  created_at: string;
  updated_at: string;
  ip_address: string;
}

export type IAddBooking = Pick<IBooking, "user_id" | "segments" | "passengers" | 'ip_address'>;

const segmentSchema = z.object({
  flight_id: z.number().int().positive(),
  seat_class: z.enum(["economy", "business", "first", "premium"]),
});

const passengerSchema = z.object({
  full_name: z.string().min(3),
  gender: z.enum(["m", "f", "x"]),
  passport_number: z.string().min(6),
  nationality: z.string().min(2),
  date_of_birth: z.string().min(3),
});

export const addSchema = z.object({
  user_id: z.number().int().positive(),
  segments: z.array(segmentSchema).min(1),
  passengers: z.array(passengerSchema).min(1),
  ip_address: z.string().min(2) // todo: z.ipv4() etc
  // currency: z.string().min(2),
  // total_amount: z.number().positive(),
  // booking_code: z.string().min(2),
  // status: z.enum(["pending", "cancelled", "delayed", "completed"]),
});
