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
// export interface ISearchFlight {
//   arrival_airport_id: number;
//   departure_airport_id: number;
//   min_departure_time: string;
//   arrival_time: string;
//   max_departure_time: string;
//   seat_class: ISeatClass;
//   adults: number;
//   children: number;
//   infants: number;
// }

export interface ISearchFlight {
  arrival_airport_id: number;
  departure_airport_id: number;
  departure_time: {
    year: number;
    month: number;
    day: number;
  };
  flexibility_days?: number;
  seat_class: ISeatClass;
  passengers: { adults: number; children: number; infants: number };
}

export const searchSchema = z.object({
  flights: z
    .array(
      z.object({
        arrival_airport_id: z.number().int().positive(),
        departure_airport_id: z.number().int().positive(),
        flexibility_days: z.number().int().positive().optional(),
        // max_departure_time: z.iso.datetime({ offset: true }),
        departure_time: z.object({
          day: z.number().int().min(1).max(31),
          month: z.number().int().min(0).max(11),
          year: z.number().int().min(2024).max(2030),
        }),
        // arrival_time: z.iso.datetime({ offset: true }),
        // min_departure_time: z.iso.datetime({ offset: true }),
        passengers: z.object({
          adults: z.number().int().min(1),
          children: z.number().int().nonnegative(),
          infants: z.number().int().nonnegative(),
        }),
        seat_class: seatClassSchema,
      })
    )
    .min(1)
    .max(6),

  departureTimes: z
    .array(
      z.object({
        min: z.number().int().min(0).max(24),
        max: z.number().int().min(0).max(24),
      })
    )
    .min(1)
    .max(6),

  airlineIds: z.array(z.number().int().positive()),
});

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

export interface ISearchResult {
  id: number;
  airline_id: number;
  airline_name: string;
  arrival_airport_id: 2;
  arrival_airport_name: string;
  arrival_time: string;
  arrival_timezone: string;
  departure_airport_id: 1;
  departure_airport_name: string;
  departure_time: string;
  departure_timezone: string;
  duration: number;
  segment_total_amount: number;
  airline_logo_url: string;
  departure_city: string;
  arrival_city: string;
}
