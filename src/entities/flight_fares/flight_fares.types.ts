import { z } from "zod";
import { ISeatClass, seatClassSchema } from "../bookings/bookings.types";

export interface IFlightFares {
  id: number;
  flight_id: number;
  base_amount: number;
  surcharge_amount: number;
  tax_amount: number;
  total_amount: number;
  seat_class: ISeatClass;
}

export type IAddFlightFares = Omit<IFlightFares, "id" | 'total_amount'>;

export const addSchema = z.object({
  flight_id: z.number().int().positive(),
  base_amount: z.number().positive(),
  surcharge_amount: z.number().positive(),
  tax_amount: z.number().positive(),
  seat_class: seatClassSchema,
});
