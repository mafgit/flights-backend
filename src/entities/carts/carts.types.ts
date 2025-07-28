import { z } from "zod";
import { ISeatClass, seatClassSchema } from "../bookings/bookings.types";

export interface ICart {
  id: number;
  user_id?: number;
  session_id?: number;
  created_at: string;
  updated_at: string;
}

export type IAddCartData = {
  flights: {
    flightId: number;
    seatClass: ISeatClass;
  }[];
  passengers: {
    adults: number;
    infants: number;
    children: number;
  };
};

export const addSchema = z.object({
  flights: z
    .array(
      z.object({
        flightId: z.number().int().min(1),
        seatClass: seatClassSchema,
      })
    )
    .min(1)
    .max(6),
  passengers: z.object({
    adults: z.number().int().min(1),
    children: z.number().int().nonnegative(),
    infants: z.number().int().nonnegative(), // todo: ensure passenger number rules in detail in all places
  }),
});
