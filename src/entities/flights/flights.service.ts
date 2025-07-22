import { IAddFlight, IFlight, ISearchFlight } from "./flights.types";
import pool from "../../database/db";
import BaseService from "../../global/BaseService";
import createHttpError from "http-errors";

export default class FlightsService extends BaseService<IFlight, IAddFlight> {
  constructor() {
    super("flights", {
      flight_number: "string",
      airline_id: "number",
      aircraft_id: "number",
      departure_airport_id: "number",
      arrival_airport_id: "number",
      status: "string",
      arrival_time: "string",
      departure_time: "string",
    });
  }

  async add(data: IAddFlight) {
    const { rows } = await pool.query(
      "insert into flights (flight_number, airline_id, aircraft_id, departure_airport_id, arrival_airport_id, status, arrival_time, departure_time) values ($1, $2, $3, $4, $5, $6, $7, $8) returning *",
      [
        data.flight_number,
        data.airline_id,
        data.aircraft_id,
        data.departure_airport_id,
        data.arrival_airport_id,
        data.status,
        data.arrival_time,
        data.departure_time,
      ]
    );
    return rows[0];
  }

  async searchFlights(flights: ISearchFlight[]) {
    const results = [];
    let minLength = Number.MAX_SAFE_INTEGER;

    for (let i = 0; i < flights.length; i++) {
      const data = flights[i];

      const totalPeople = data.adults + data.infants + data.children;
      if (totalPeople === 0) {
        throw createHttpError(400, "There must be at least one passenger");
      }
      if (totalPeople > 10) {
        throw createHttpError(400, "More than 10 passengers are not allowed");
      }
      if (
        data.adults !== Math.floor(data.adults) ||
        data.children !== Math.floor(data.children) ||
        data.infants !== Math.floor(data.infants)
      ) {
        throw createHttpError(400, "Invalid number of passengers");
      }

      let query = `select *, SUM(total_amount * (${data.adults} + ${data.children} + ${data.infants})) as total, 
                      EXTRACT(EPOCH FROM (arrival_time - departure_time)) / 3600 as duration from flights 
                      join flight_fares on flight_fares.flight_id = flights.id
                      where arrival_airport_id = $1 and departure_airport_id = $2 and seat_class = $3 
                      and status = 'scheduled' and arrival_time >= $4 and arrival_time <= $5 and departure_time >= $6 
                      and departure_time <= $7 order by total asc, duration asc limit 10`;

      // todo?: more complex logic for adult/children/infant

      const { rows } = await pool.query(query, [
        data.arrival_airport_id,
        data.departure_airport_id,
        data.seat_class,
        data.arrival_time,
        data.min_departure_time,
        data.max_departure_time,
      ]); // todo: check

      results.push(rows);

      if (rows.length < minLength) minLength = rows.length;
    }

    if (minLength === 0)
      throw createHttpError(400, "No flights found for your exact search");

    // [1,2,3]
    // [4,5] (2)
    // [6,7,8]

    // 1,4,6
    // 2,5,7
    const combinations = [];
    for (let i = 0; i < minLength; i++) {
      for (let j = 0; j < results.length; j++) {
        combinations.push(results[j][i]);
      }
    }

    return combinations;
  }
}
