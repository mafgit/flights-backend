import { IBooking, IPassenger, ISeatClass, ISegment } from "./bookings.types";
import pool from "../../database/db";
import createHttpError from "http-errors";
import PaymentsService, { paymentsService } from "../payments/payments.service";
import { PoolClient } from "pg";
import { IBookingAndPaymentBody } from "../payments/payments.types";
import { validatePassengerCounts } from "./bookings.utils";

export default class BookingsService {
  declare paymentsService: PaymentsService;

  constructor(paymentsService: PaymentsService) {
    this.paymentsService = paymentsService;
  }

  private async insertPassenger(passenger: IPassenger, added_by?: number) {
    console.log(added_by, passenger);

    const { rows: insertedPassengers } = await pool.query(
      "insert into passengers (added_by, date_of_birth, full_name, gender, nationality, passport_number, passenger_type) values ($1, $2, $3, $4, $5, $6, $7) returning *",
      [
        added_by,
        passenger.date_of_birth,
        passenger.full_name,
        passenger.gender,
        passenger.nationality,
        passenger.passport_number,
        passenger.passenger_type,
      ]
    );

    return insertedPassengers[0].id as number;
  }

  private async getAvailableSeatIds(
    client: PoolClient,
    segment: ISegment,
    numSeats: number = 1
  ) {
    const { rows: seatRows } = await client.query(
      "select id from seats where flight_id = $1 and seat_class = $2 and is_available = true for update",
      [segment.flight_id, segment.seat_class]
    );
    if (seatRows.length < numSeats) {
      throw createHttpError(
        400,
        "Enough seats are not available for this seat class in this flight"
      ); // todo?: add manual seat selection
    }
    return seatRows.map((s) => s.id);
  }

  private async insertBooking(
    client: PoolClient,
    {
      user_id,
      total_surcharge_amount,
      total_base_amount,
      total_tax_amount,
      total_amount,
      receipt_email,
      currency,
      ip_address,
    }: {
      user_id?: number;
      total_surcharge_amount: number;
      total_base_amount: number;
      total_tax_amount: number;
      total_amount: number;
      receipt_email?: string;
      currency: string;
      ip_address?: string;
    }
  ) {
    const { rows: insertedBookings } = await client.query<IBooking>(
      "insert into bookings (user_id, receipt_email, total_amount, surcharge_amount, base_amount, tax_amount, currency) values($1, $2, $3, $4, $5, $6, $7) returning *",
      [
        user_id,
        receipt_email,
        total_amount,
        total_surcharge_amount,
        total_base_amount,
        total_tax_amount,
        currency,
        // todo: ip_address
      ]
    ); // todo: check currency

    return insertedBookings[0];
  }

  private async insertAllSegments(
    client: PoolClient,
    bookingId: number,
    segmentQueries: [string, any[]][]
  ) {
    // todo: insert statements to be merged into one query rather than in a loop
    let segmentsReturned: ISegment[] = [];

    for (let i = 0; i < segmentQueries.length; i++) {
      const returned = await client.query<ISegment>(segmentQueries[i][0], [
        bookingId,
        ...segmentQueries[i][1],
      ]);
      segmentsReturned.push(returned.rows[0]);
    }

    return segmentsReturned;
  }

  private getPassengerCounts(passengers: IPassenger[]) {
    let adults = passengers.filter((p) => p.passenger_type === "adult").length;
    let children = passengers.filter(
      (p) => p.passenger_type === "child"
    ).length;
    let infants = passengers.filter(
      (p) => p.passenger_type === "infant"
    ).length;

    return { adults, children, infants };
  }

  private async validateBookingItems(
    client: PoolClient,
    {
      receipt_email,
      user_id,
      adults,
      children,
      infants,
      passengers,
      segments,
      converted_total_amount,
      booking_id,
    }: {
      user_id?: number;
      receipt_email?: string;
      adults: number;
      children: number;
      infants: number;
      passengers: IPassenger[];
      segments: ISegment[];
      converted_total_amount: number;
      booking_id?: number;
    }
  ) {
    // if (booking_id) {
    //   const { rows: bookings } = await client.query(
    //     "select status from bookings where id = $1 for update",
    //     [booking_id]
    //   );
    //   const { status } = bookings[0];
    //   if (status === "confirmed") {
    //     throw createHttpError(400, "Booking already confirmed");
    //   } else if (status === "cancelled") {
    //     throw createHttpError(
    //       400,
    //       "Booking has been cancelled, please book again"
    //     );
    //   }
    // }

    if (!validatePassengerCounts(adults, children, infants)) {
      throw createHttpError(400, "Invalid number of passengers");
    }

    const segmentsFromDB: {
      segment_total_amount: number;
      segment_base_amount: number;
      segment_tax_amount: number;
      segment_surcharge_amount: number;
      seat_class: ISeatClass;
      flight_id: number;
      departure_time: string;
      passenger: IPassenger;
    }[] = [];

    for (let s = 0; s < segments.length; s++) {
      for (let p = 0; p < passengers.length; p++) {
        const field =
          passengers[p].passenger_type === "adult"
            ? "ff.adult_base_amount"
            : passengers[p].passenger_type === "child"
            ? "ff.child_base_amount"
            : "ff.infant_base_amount";

        const { rows } = await client.query(
          `select f.id as flight_id, departure_time, s.seat_class,
    ${field} as segment_base_amount,
    ff.tax_amount as segment_tax_amount, 
    ff.surcharge_amount as segment_surcharge_amount,
    (${field} + ff.tax_amount + ff.surcharge_amount) as segment_total_amount
  from flights f
    join flight_fares ff on ff.flight_id = f.id
    join seats s on s.flight_id = f.id and s.seat_class = ff.seat_class
  where f.id = $1
    and f.status = 'scheduled'
    and s.seat_class = $2
    and s.is_available = true
  group by f.id, s.seat_class, ff.id
    having count(s.id) >= $3`,
          [segments[s].flight_id, segments[s].seat_class, adults + children]
        );

        if (rows.length === 0) {
          throw createHttpError(
            400,
            "No flights found for this request, possibly due to unavailability of seats."
          );
        }

        segmentsFromDB.push({
          ...rows[0],
          passenger: passengers[p],
          segment_base_amount: parseFloat(rows[0].segment_base_amount),
          segment_tax_amount: parseFloat(rows[0].segment_tax_amount),
          segment_surcharge_amount: parseFloat(
            rows[0].segment_surcharge_amount
          ),
          segment_total_amount: parseFloat(rows[0].segment_total_amount),
        });
      }
    }

    const totalFromDB = segmentsFromDB.reduce(
      (acc, s) => acc + s.segment_total_amount,
      0
    );

    if (totalFromDB.toFixed(2) !== converted_total_amount.toFixed(2)) {
      throw createHttpError(
        400,
        `The amount you tried to pay, ${converted_total_amount.toFixed(
          2
        )}, does not match the true amount, ${totalFromDB.toFixed(
          2
        )}, at this moment`
      );
    }

    return segmentsFromDB;
  }

  async handleBookingIntent(
    currency: string,
    exchangeRate: number,
    {
      user_id,
      passengers,
      segments,
      total_amount,
      receipt_email,
    }: IBookingAndPaymentBody
  ) {
    console.log("booking intent received");

    const client = await pool.connect();
    try {
      await client.query("begin");
      const { adults, children, infants } = this.getPassengerCounts(passengers);

      const segmentsFromDB = await this.validateBookingItems(client, {
        user_id,
        receipt_email,
        adults,
        children,
        infants,
        passengers,
        segments,
        converted_total_amount: total_amount / exchangeRate,
      });

      let segmentQueries: [string, any[]][] = [];
      let passengersAddedIds: number[] = [];

      const seats: { flight_id: number; seat_id: number | undefined }[] = [];

      const availableSeatIds: Record<number, number[]> = {};

      for (let i = 0; i < segmentsFromDB.length; i++) {
        if (!(segmentsFromDB[i].flight_id in availableSeatIds)) {
          availableSeatIds[segmentsFromDB[i].flight_id] =
            await this.getAvailableSeatIds(
              client,
              segmentsFromDB[i],
              adults + children
            );
        }

        let newPassengerId = segmentsFromDB[i].passenger.id;
        if (!newPassengerId) {
          newPassengerId = await this.insertPassenger(
            segmentsFromDB[i].passenger,
            user_id
          );
        }
        passengersAddedIds.push(newPassengerId);
        const seatId =
          segmentsFromDB[i].passenger.passenger_type === "infant"
            ? undefined
            : availableSeatIds[segmentsFromDB[i].flight_id].shift();
        seats.push({
          seat_id: seatId,
          flight_id: segmentsFromDB[i].flight_id,
        });
        // will add segments after adding booking
        segmentQueries.push([
          "insert into booking_segments (booking_id, passenger_id, flight_id, seat_id, base_amount, tax_amount, surcharge_amount, total_amount) values ($1, $2, $3, $4, $5, $6, $7, $8) returning *",
          [
            // booking id inserted later in the array,
            newPassengerId,
            segmentsFromDB[i].flight_id,
            seatId,
            segmentsFromDB[i].segment_base_amount,
            segmentsFromDB[i].segment_tax_amount,
            segmentsFromDB[i].segment_surcharge_amount,
            segmentsFromDB[i].segment_total_amount,
          ],
        ]);
      }

      // adding booking
      let total_base_amount = segmentsFromDB.reduce(
        (acc, s) => acc + s.segment_base_amount,
        0
      );
      let total_tax_amount = segmentsFromDB.reduce(
        (acc, s) => acc + s.segment_tax_amount,
        0
      );
      let total_surcharge_amount = segmentsFromDB.reduce(
        (acc, s) => acc + s.segment_surcharge_amount,
        0
      );

      const insertedBooking = await this.insertBooking(client, {
        user_id,
        receipt_email,
        total_surcharge_amount,
        total_base_amount,
        total_tax_amount,
        total_amount,
        currency: currency,
        // ip_address,
      });

      const segmentsReturned = await this.insertAllSegments(
        client,
        insertedBooking.id,
        segmentQueries
      );

      console.log("\n === CALLING PAYMENT SERVICE === \n");

      const { clientSecret } = await this.paymentsService.handlePaymentIntent({
        adults,
        children,
        infants,
        segments,
        total_amount,
        receipt_email,
        user_id,
        booking_id: insertedBooking.id,
        seats,
        currency,
      });

      console.log("\n === COMMITTING === \n");

      await client.query("commit");

      return {
        // ...insertedBooking,
        // segments: segmentsReturned,
        bookingId: insertedBooking.id,
        clientSecret,
      };
    } catch (error) {
      console.error("\n === ROLLING BACK === \n");
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }

  async getMyBookings(userId: number) {
    const { rows: bookings } = await pool.query(
      "select * from bookings where user_id = $1",
      [userId]
    );

    if (bookings.length === 0) return [];

    const returnObj: IBooking[] = [];

    for (let i = 0; i < bookings.length; i++) {
      const { rows: segments } = await pool.query(
        "select * from booking_segments join passengers on booking_segment.passenger_id = passengers.id where booking_id = $1",
        [bookings[i].id]
      );

      returnObj.push({
        ...bookings[i],
        segments,
      });
    }

    return returnObj;
  }

  // todo: async cancel() {}

  async getOneBooking(exchangeRate: number, id: number) {
    const { rows: bookings } = await pool.query(
      "select * from bookings where id = $1 limit 1",
      [id]
    );
    if (bookings.length === 0) return null;

    const { rows: segments } = await pool.query(
      `
select bs.*, p.*, bs.status, s.seat_class,
f.departure_time, f.arrival_time,
a1.city as departure_city, a1.name as departure_airport_name, a1.code as departure_airport_code,
a2.city as arrival_city, a2.name as arrival_airport_name, a2.code as arrival_airport_code
from booking_segments bs
join passengers p on bs.passenger_id = p.id
join flights f on f.id = bs.flight_id
left join seats s on s.id = bs.seat_id and s.flight_id = f.id
join airports a1 on f.departure_airport_id = a1.id
join airports a2 on f.arrival_airport_id = a2.id
where bs.booking_id = $1
`,
      [id]
    );

    if (segments.length === 0) return null;

    return {
      booking: {
        ...bookings[0],
        base_amount: parseFloat(bookings[0].base_amount) * exchangeRate,
        surcharge_amount:
          parseFloat(bookings[0].surcharge_amount) * exchangeRate,
        tax_amount: parseFloat(bookings[0].tax_amount) * exchangeRate,
        total_amount: parseFloat(bookings[0].total_amount), // already storing it in correct currency so no need to multiply
      },
      segments: segments.map((s) => ({
        ...s,
        base_amount: parseFloat(s.base_amount) * exchangeRate,
        surcharge_amount: parseFloat(s.surcharge_amount) * exchangeRate,
        tax_amount: parseFloat(s.tax_amount) * exchangeRate,
        total_amount: parseFloat(s.total_amount) * exchangeRate,
      })),
    };
  }
}

export const bookingsService = new BookingsService(paymentsService);
