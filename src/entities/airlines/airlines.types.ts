import { z } from "zod";

export interface IAirline {
  id: number;
  name: string;
  code: string;
  country: string;
  logo_url: string;
}

export type IAddAirline = Pick<
  IAirline,
  "name" | "code" | "country" | "logo_url"
>;

export const addSchema = z.object({
  name: z.string().min(3),
  code: z.string().min(2),
  country: z.string().min(2),
  logo_url: z.url(),
});
