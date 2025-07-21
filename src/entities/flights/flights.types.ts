import { z } from "zod";
import { ISeatClass, seatClassSchema } from "../bookings/bookings.types";

export type IFlightStatus = "scheduled" | "cancelled" | "delayed" | "completed";

export interface IFlight {
  id: number;
  flight_number: string;
  airline_id: number;
  aircraft_id: number;
  departure_airport_id: number;
  arrival_airport_id: number;
  status: IFlightStatus;
  arrival_time: string;
  departure_time: string;
}

export type IAddFlight = Omit<IFlight, "id">;
// export type ISearchFlight = Omit<
//   IFlight,
//   "id" | "status" | "airline_id" | "aircraft_id" | "flight_number"
// >;
export interface ISearchFlight {
  arrival_airport_id: number;
  departure_airport_id: number;
  min_departure_time: string;
  arrival_time: string;
  max_departure_time: string;
  seat_class: ISeatClass;
  adults: number;
  children: number;
  infants: number;
}

export const searchSchema = z
  .array(
    z.object({
      arrival_airport_id: z.number().positive(),
      departure_airport_id: z.number().positive(),
      max_departure_time: z.iso.datetime({ offset: true }),
      arrival_time: z.iso.datetime({ offset: true }),
      min_departure_time: z.iso.datetime({ offset: true }),
      adults: z.number().int().min(1),
      children: z.number().int().nonnegative(),
      infants: z.number().int().nonnegative(),
      seat_class: seatClassSchema,
    })
  )
  .min(1);

export const addSchema = z.object({
  flight_number: z.string().min(2),
  airline_id: z.number().positive(),
  aircraft_id: z.number().positive(),
  departure_airport_id: z.number().positive(),
  arrival_airport_id: z.number().positive(),
  status: z.enum(["scheduled", "cancelled", "delayed", "completed"]),
  arrival_time: z.iso.datetime({ offset: true }),
  departure_time: z.iso.datetime({ offset: true }),
});
