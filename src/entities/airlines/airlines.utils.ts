import { z } from "zod";
import { IAddAirline, IAirline } from "./airlines.types";

const schema = z.object({
  name: z.string().min(3),
  code: z.string().min(2),
  country: z.string().min(2),
  logo_url: z.url(),
});

export const validateAddBody = (
  data: IAddAirline
) => {
  return schema.parse(data);
};

export const validateUpdateBody = (data: Partial<IAirline>) => {
  return schema.partial().parse(data);
};
