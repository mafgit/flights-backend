import { IAddCartData } from "./carts.types";
import pool from "../../database/db";
import createHttpError from "http-errors";
import { v4 as uuidv4 } from "uuid";

export default class CartsService {
  async getOne(
    exchangeRate: number,
    userId?: number,
    sessionId?: number,
    cartId?: number
  ) {
    if (userId || (sessionId && cartId)) {
      let cart;
      // -------------- getting cart --------------
      if (userId) {
        const { rows } = await pool.query(
          "select * from carts where user_id = $1 limit 1",
          [userId]
        );
        cart = rows[0];
      } else {
        const { rows } = await pool.query(
          "select * from carts where session_id = $1 and id = $2 limit 1",
          [sessionId, cartId]
        );
        cart = rows[0];
      }

      // --------------- getting cart passengers --------------
      const { rows: passengers } = await pool.query(
        "select * from cart_passengers where cart_id = $1",
        [cart.id]
      );

      let infants = 0,
        children = 0,
        adults = 0;
      passengers.forEach((p) => {
        if (p.passenger_type === "infant") {
          infants++;
        } else if (p.passenger_type === "child") {
          children++;
        } else {
          adults++;
        }
      });

      // --------------- getting cart segments ----------------
      const { rows: segments } = await pool.query(
        `
select distinct f.id, s.seat_class, ff.adult_base_amount, ff.tax_amount, ff.surcharge_amount, ff.child_base_amount, ff.infant_base_amount, f.departure_airport_id, f.arrival_airport_id, f.airline_id, f.arrival_time, f.departure_time,
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
join seats s on s.flight_id = f.id and ff.seat_class = s.seat_class
join cart_segments cs on f.id = cs.flight_id and cs.seat_class = s.seat_class
where f.id = cs.flight_id and s.is_available = true
	and f.status = 'scheduled' and cs.cart_id = $4
order by departure_time asc;`,
        [adults, children, infants, cart.id]
      );

      return {
        cart,
        segments: segments.map((s) => ({
          ...s,
          duration: parseFloat(s.duration),
          segment_total_amount:
            parseFloat(s.segment_total_amount) * exchangeRate,
          adult_base_amount: parseFloat(s.adult_base_amount) * exchangeRate,
          tax_amount: parseFloat(s.tax_amount) * exchangeRate,
          surcharge_amount: parseFloat(s.surcharge_amount) * exchangeRate,
          child_base_amount: parseFloat(s.child_base_amount) * exchangeRate,
          infant_base_amount: parseFloat(s.infant_base_amount) * exchangeRate,
        })),
        passengers,
      };
    } else {
      throw createHttpError(401, "Neither session id found, nor token");
    }
  }

  async add(
    { flights, passengers }: IAddCartData,
    userId?: number,
    sessionId?: string
  ) {
    if (!sessionId && !userId) {
      sessionId = uuidv4();
    } else {
      await this.delete(sessionId, userId);
    }
    // ----- delete previous -----

    const { rows: cartRows } = await pool.query(
      "insert into carts (user_id, session_id) values ($1, $2) returning *",
      [userId, sessionId]
    );

    const cart = cartRows[0];
    const cartId = cart.id;

    // -------- inserting cart segments --------
    let i = 1;
    let q =
      "insert into cart_segments (cart_id, seat_class, flight_id) values ";
    let queries = [];
    let values = [];
    for (let j = 0; j < flights.length; j++) {
      queries.push(`($${i++}, $${i++}, $${i++})`);
      values.push(cartId, flights[j].seatClass, flights[j].flightId);
    }

    q += queries.join(", ") + " returning *";
    console.log(q, values);

    const { rows: segmentRows } = await pool.query(q, values);

    // -------- inserting cart passengers --------

    i = 1;
    q =
      "insert into cart_passengers (cart_id, full_name, gender, passport_number, nationality, date_of_birth, passenger_type) values ";
    queries = [];
    values = [];

    let types = [];

    for (let i = 0; i < passengers.adults; i++) types.push("adult");

    for (let i = 0; i < passengers.children; i++) types.push("child");

    for (let i = 0; i < passengers.infants; i++) types.push("infant");

    for (let type of types) {
      queries.push(
        `($${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++})`
      );
      values.push(cartId, null, "undisclosed", null, null, null, type);
    }

    q += queries.join(", ") + " returning *";
    console.log(q, values);

    const { rows: passengerRows } = await pool.query(q, values);

    return { cart, segments: segmentRows, passengers: passengerRows };
  }

  async delete(sessionId?: string, userId?: number) {
    if (userId || sessionId) {
      if (userId) {
        await pool.query("delete from carts where user_id = $1", [userId]);
      } else if (sessionId) {
        await pool.query("delete from carts where session_id = $1", [
          sessionId,
        ]);
      }
    } else {
      throw createHttpError(401, "Neither session id found, nor token");
    }
  }
}
