import { IAddAirline, IAirline } from "./airlines.types";
import pool from "../../database/db";
import BaseService from "../../global/BaseService";

export default class AirlinesService extends BaseService<IAirline> {
  constructor() {
    super("airlines", {
      id: "number",
      name: "string",
      code: "string",
      country: "string",
      logo_url: "string",
    });
  }

  async add(data: IAddAirline) {
    const { rows } = await pool.query(
      "insert into airlines (name, code, country, logo_url) values ($1, $2, $3, $4) returning *",
      [data.name, data.code, data.country, data.logo_url]
    );
    return rows[0];
  }
}
