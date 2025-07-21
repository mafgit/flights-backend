import { IAddAircraft, IAircraft } from "./aircrafts.types";
import pool from "../../database/db";
import BaseService from "../../global/BaseService";

export default class AircraftsService extends BaseService<
  IAircraft,
  IAddAircraft
> {
  constructor() {
    super("aircrafts", {
      model: "string",
      manufacturer: "string",
      capacity: "number",
    });
  }

  async add(data: IAddAircraft) {
    const { rows } = await pool.query(
      "insert into aircrafts (model, manufacturer, capacity) values ($1, $2, $3) returning *",
      [data.model, data.manufacturer, data.capacity]
    );
    return rows[0];
  }
}
