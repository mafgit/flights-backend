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

  async handlePaymentIntent(data: IAddFlight) {
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

  async searchFlights(
    flights: ISearchFlight[],
    passengers: { adults: number; children: number; infants: number },
    departureTimes: { min: number; max: number }[],
    airlineIds: number[],
    maxTotalDuration?: number
  ) {
    const results: ISearchResult[][] = [];
    let minLength = Number.MAX_SAFE_INTEGER;
    if (flights.length !== departureTimes.length || flights.length === 0) {
      throw createHttpError(400, "Invalid search request");
    }

    const totalPeople =
      passengers.adults + passengers.infants + passengers.children;

    if (
      passengers.adults !== Math.floor(passengers.adults) ||
      passengers.children !== Math.floor(passengers.children) ||
      passengers.infants !== Math.floor(passengers.infants)
    ) {
      throw createHttpError(400, "Invalid number of passengers");
    }

    for (let i = 0; i < flights.length; i++) {
      const data = flights[i];

      if (totalPeople === 0) {
        throw createHttpError(400, "There must be at least one passenger");
      }
      if (totalPeople > 10) {
        throw createHttpError(400, "More than 10 passengers are not allowed");
      }

      let x = 4;

      let conditions = [
        "s.is_available = true",
        "f.status = 'scheduled'",
        `departure_airport_id = $${x++}`,
        `arrival_airport_id = $${x++}`,
        `f.departure_time >= $${x++}`,
        `f.departure_time <= $${x++}`,
        `extract(hour from f.departure_time) + extract(minute from f.departure_time) / 60 between $${x++} and $${x++}`,
      ];

      const departureTime = new Date(
        data.departure_time.year,
        data.departure_time.month - 1,
        data.departure_time.day,
        0,
        0,
        0,
        0
      );

      const minDepartureTime = new Date(departureTime);
      minDepartureTime.setDate(
        minDepartureTime.getDate()
        //  - data.departure_time.flexibility_days
      );
      const maxDepartureTime = new Date(departureTime);
      maxDepartureTime.setDate(
        maxDepartureTime.getDate() + data.departure_time.flexibility_days + 1
      );

      let queryValues: any = [
        passengers.adults,
        passengers.children,
        passengers.infants,
        data.departure_airport_id,
        data.arrival_airport_id,
        minDepartureTime.toISOString(), // with 0:0:0 time for minimum day
        maxDepartureTime.toISOString(), // with 0:0:0 time for maximum day
        departureTimes[i].min, // for exact time window of that departure day
        departureTimes[i].max, // for exact time window of that departure day,
      ];

      if (airlineIds.length > 0) {
        conditions.push(`al.id = any($${x++})`);
        queryValues.push(airlineIds);
      }

      if (data.seat_class !== "any") {
        conditions.push(`s.seat_class = $${x++}`);
        queryValues.push(data.seat_class);
      }

      let having = [`count(s.id) >= $${x++}`];
      queryValues.push(passengers.adults + passengers.children);

      let query = `
select distinct f.id, s.seat_class, f.departure_airport_id, f.arrival_airport_id, f.airline_id, f.arrival_time, f.departure_time,
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
join seats s on s.flight_id = f.id and s.seat_class = ff.seat_class
where ${conditions.join(" and ")}
group by f.id, s.seat_class, ap1.id, ap2.id, al.id, ff.id
	having ${having.join(" and ")}
  order by segment_total_amount asc, duration asc
limit 7;
      `;

      console.log(query, "\n\n", queryValues);

      // if (airlineIds.length > 0) queryValues.push(airlineIds);
      // queryValues.push(passengers.adults + passengers.children);

      const { rows } = await pool.query(query, queryValues);

      if (rows.length === 0) {
        return [];
      }

      results.push(
        rows.map((r) => ({
          ...r,
          segment_total_amount: parseFloat(r.segment_total_amount),
          duration: parseFloat(r.duration),
        }))
      );

      if (rows.length < minLength) minLength = rows.length;
    }

    if (minLength === 0) return [];

    // [1,2,3]
    // [4,5] (2)
    // [6,7,8]

    // 1,4,6
    // 2,5,7
    const combinations = cartesian(results);
    if (maxTotalDuration) {
      return combinations.filter(
        (c) =>
          c.reduce((acc, curr) => acc + curr.duration, 0) <= maxTotalDuration
      );
    }

    console.log(combinations);

    return combinations;
  }
}

// todo: ensure that prev segment is not after this segment (both in back and frontend)
// todo: ensure when querying flights, that X number of seats are available

function cartesian(arrays: ISearchResult[][]) {
  return arrays.reduce<ISearchResult[][]>(
    (a, b) => a.flatMap((x) => b.map((y) => [...x, y])),
    [[]]
  );
}
