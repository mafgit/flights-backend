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
