import { IAddAirport, IAirport } from "./airports.types";
import pool from "../../database/db";
import BaseService from "../../global/BaseService";

export default class AirportsService extends BaseService<IAirport, IAddAirport> {
  constructor() {
    super("airports", {
      name: "string",
      code: "string",
      country: "string",
      city: "string",
      timezone: "string",
      latitude: "number",
      longitude: "number",
    });
  }

  async handlePaymentIntent(data: IAddAirport) {
    const { rows } = await pool.query(
      "insert into airports (name, code, country, city, timezone, latitude, longitude) values ($1, $2, $3, $4, $5, $6, $7) returning *",
      [
        data.name,
        data.code,
        data.country,
        data.city,
        data.timezone,
        data.latitude,
        data.longitude,
      ]
    );
    return rows[0];
  }
}
