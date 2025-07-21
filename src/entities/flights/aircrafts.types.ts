import { z } from "zod";

export interface IAircraft {
  id: number;
  model: string;
  manufacturer: string;
  capacity: number;
}

export type IAddAircraft = Pick<
  IAircraft,
  "model" | "manufacturer" | "capacity"
>;

export const addSchema = z.object({
  model: z.string().min(2),
  manufacturer: z.string().min(2),
  capacity: z.number().int().positive(),
});
