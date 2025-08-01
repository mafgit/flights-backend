import { IAddFlightFares, IFlightFares } from "./flight_fares.types";
import pool from "../../database/db";
import BaseService from "../../global/BaseService";

export default class FlightFaresService extends BaseService<
  IFlightFares,
  IAddFlightFares
> {
  constructor() {
    super("flight_fares", {
      id: "number",
      flight_id: "number",
      base_amount: "number",
      surcharge_amount: "number",
      tax_amount: "number",
      total_amount: "number",
      seat_class: "string",
    });
  }

  async handlePaymentIntent(data: IAddFlightFares) {
    const { rows } = await pool.query(
      "insert into flightFares (flight_id, base_amount, surcharge_amount, tax_amount, total_amount, seat_class) values ($1, $2, $3, $4, $5, $6) returning *",
      [
        data.flight_id,
        data.base_amount,
        data.surcharge_amount,
        data.tax_amount,
        data.base_amount + data.surcharge_amount + data.tax_amount,
        data.seat_class,
      ]
    );
    return rows[0];
  }
}
