import { z } from "zod";
import { ISeatClass, seatClassSchema } from "../bookings/bookings.types";

export interface ISeat {
  id: number;
  flight_id: number;
  seat_number: string;
  is_available: boolean;
  seat_class: ISeatClass;
}

export type IAddSeat = Omit<ISeat, "id" | "is_available">;

export const addSchema = z.object({
  flight_id: z.number().int().positive(),
  seat_number: z.string().min(2),
  seat_class: seatClassSchema,
});
