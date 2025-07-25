import {
  IAddFlight,
  IFlight,
  ISearchFlight,
  ISearchResult,
} from "./flights.types";
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
    const results: ISearchResult[][] = [];
    let minLength = Number.MAX_SAFE_INTEGER;

    for (let i = 0; i < flights.length; i++) {
      const data = flights[i];

      const totalPeople =
        data.passengers.adults +
        data.passengers.infants +
        data.passengers.children;
      if (totalPeople === 0) {
        throw createHttpError(400, "There must be at least one passenger");
      }
      if (totalPeople > 10) {
        throw createHttpError(400, "More than 10 passengers are not allowed");
      }
      if (
        data.passengers.adults !== Math.floor(data.passengers.adults) ||
        data.passengers.children !== Math.floor(data.passengers.children) ||
        data.passengers.infants !== Math.floor(data.passengers.infants)
      ) {
        throw createHttpError(400, "Invalid number of passengers");
      }

      let query = `
select f.id, f.departure_airport_id, f.arrival_airport_id, f.airline_id, f.arrival_time, f.departure_time,
	ap1.name as departure_airport_name, ap1.city as departure_city,
	ap2.name as arrival_airport_name, ap2.city as arrival_city,
	al.name as airline_name, al.logo_url as airline_logo_url,
	ap1.timezone as departure_timezone,
	ap2.timezone as arrival_timezone,
	round(extract(epoch from (f.arrival_time - f.departure_time)) / 3600, 1) as duration,
	(
		$1 * (ff.adult_base_amount + ff.tax_amount + ff.surcharge_amount)
		+ $2 * (ff.child_base_amount + ff.tax_amount + ff.surcharge_amount)
		+ $3 * (ff.infant_base_amount + ff.tax_amount + ff.surcharge_amount)
	) as segment_total_amount
from flights f
join airports ap1 on f.departure_airport_id = ap1.id
join airports ap2 on f.arrival_airport_id = ap2.id
join airlines al on f.airline_id = al.id
join flight_fares ff on ff.flight_id = f.id
join seats s on s.flight_id = f.id
where s.seat_class = $4 and s.is_available = true
	and f.status = 'scheduled'
	and departure_airport_id = $5 and arrival_airport_id = $6
	and f.departure_time >= $7 and f.departure_time <= $8
  and ff.seat_class = s.seat_class
group by f.id, ap1.name, ap2.name, al.name, ap1.timezone, ap2.timezone, al.logo_url, ap1.city, ap2.city,
  ff.adult_base_amount, ff.tax_amount, ff.surcharge_amount, ff.child_base_amount, ff.infant_base_amount
order by segment_total_amount asc, duration asc
limit 10;
      `;

      const minDepartureTime = new Date(
        data.departure_time.year,
        data.departure_time.month - 1,
        data.departure_time.day,
        0,
        0,
        0,
        0
      );

      const maxDepartureTime = new Date(minDepartureTime);
      maxDepartureTime.setDate(maxDepartureTime.getDate() + 1);

      const { rows } = await pool.query(query, [
        data.passengers.adults,
        data.passengers.children,
        data.passengers.infants,
        data.seat_class,
        data.departure_airport_id,
        data.arrival_airport_id,
        minDepartureTime.toISOString(),
        maxDepartureTime.toISOString(),
      ]);

      results.push(
        rows.map((r) => ({
          ...r,
          segment_total_amount: parseFloat(r.segment_total_amount),
          duration: parseFloat(r.duration),
        }))
      );

      if (rows.length < minLength) minLength = rows.length;
    }

    // console.log("results", results);

    if (minLength === 0) return [];

    // [1,2,3]
    // [4,5] (2)
    // [6,7,8]

    // 1,4,6
    // 2,5,7
    const combinations: ISearchResult[][] = [];
    for (let i = 0; i < minLength; i++) {
      combinations[i] = [];
      for (let j = 0; j < results.length; j++) {
        combinations[i].push(results[j][i]);
      }
    }

    return combinations;
  }
}
