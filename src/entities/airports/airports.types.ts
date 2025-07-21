import { z } from "zod";

export interface IAirport {
  id: number;
  name: string;
  code: string;
  country: string;
  city: string;
  timezone: string;
  latitude: number;
  longitude: number;
}

export type IAddAirport = Pick<
  IAirport,
  "name" | "code" | "country" | "city" | "timezone" | "latitude" | "longitude"
>;

export const addSchema = z.object({
  name: z.string().min(3),
  code: z.string().min(2),
  country: z.string().min(2),
  city: z.string().min(2),
  timezone: z.string().min(2),
  latitude: z.number(),
  longitude: z.number(),
});
