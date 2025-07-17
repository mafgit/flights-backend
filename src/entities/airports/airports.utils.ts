import { z } from "zod";
import { IAirport, IAddAirport } from "./airports.types";

const schema = z.object({
  name: z.string().min(3),
  code: z.string().min(2),
  country: z.string().min(2),
  city: z.string().min(2),
  timezone: z.string().min(2),
  latitude: z.number(),
  longitude: z.number(),
});

export const validateAddBody = (data: IAddAirport) => {
  return schema.parse(data);
};

export const validateUpdateBody = (data: Partial<IAirport>) => {
  return schema.partial().parse(data);
};
