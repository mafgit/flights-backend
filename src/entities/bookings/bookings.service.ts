import { IBooking, IPassenger, ISegment } from "./bookings.types";
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

  private async insertPassenger(passenger: IPassenger) {
    const { rows: insertedPassengers } = await pool.query(
      "insert into passengers (date_of_birth, full_name, gender, nationality, passport_number, passenger_type) values ($1, $2, $3, $4, $5, $6) returning *",
      [
        passenger.date_of_birth,
        passenger.full_name,
        passenger.gender,
        passenger.nationality,
        passenger.passport_number,
        passenger.passenger_type,
      ]
    );

    return insertedPassengers[0].id;
  }

  private async getAvailableSeatId(client: PoolClient, segment: ISegment) {
    const { rows: seatRows } = await client.query(
      "select * from seats where flight_id = $1 and seat_class = $2 and is_available = true limit 1 for update",
      [segment.flight_id, segment.seat_class]
    );
    if (seatRows.length === 0) {
      throw createHttpError(
        400,
        "No seat available for this class in this flight"
      ); // todo?: add manual seat selection
    }
    return seatRows[0].id;
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
      total_amount,
      booking_id,
    }: {
      user_id?: number;
      receipt_email?: string;
      adults: number;
      children: number;
      infants: number;
      passengers: IPassenger[];
      segments: ISegment[];
      total_amount: number;
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
      // todo: maybe add individual adult, etc prices to booking too?
    }[] = [];

    for (let i = 0; i < segments.length; i++) {
      const { rows } = await client.query(
        `
  select distinct f.id as flight_id, departure_time,
    (
      $1 * ff.adult_base_amount
      + $2 * ff.child_base_amount
      + $3 * ff.infant_base_amount
    ) as segment_base_amount,
     (
      $1 * ff.tax_amount
      + $2 * ff.tax_amount
      + $3 * ff.tax_amount
    ) as segment_tax_amount, 
     (
      $1 * ff.surcharge_amount
      + $2 * ff.surcharge_amount
      + $3 * ff.surcharge_amount
    ) as segment_surcharge_amount,
    (
      $1 * (ff.adult_base_amount + ff.tax_amount + ff.surcharge_amount)
      + $2 * (ff.child_base_amount + ff.tax_amount + ff.surcharge_amount)
      + $3 * (ff.infant_base_amount + ff.tax_amount + ff.surcharge_amount)
    ) as segment_total_amount
  from flights f
    join flight_fares ff on ff.flight_id = f.id
    join seats s on s.flight_id = f.id and s.seat_class = ff.seat_class
  where f.id = $4 and s.is_available is true
    and f.status = 'scheduled'
    and s.seat_class = $5
    and s.is_available = true
  group by f.id, s.seat_class, ff.id
    having count(s.id) >= $6
  `,
        [
          adults,
          children,
          infants,
          segments[i].flight_id,
          segments[i].seat_class,
          adults + children,
        ]
      );

      if (rows.length === 0) {
        throw createHttpError(
          400,
          "No flights found for this request, possibly due to unavailability of seats."
        );
      }

      segmentsFromDB.push({
        ...rows[0],
        segment_base_amount: parseFloat(rows[0].segment_base_amount),
        segment_tax_amount: parseFloat(rows[0].segment_tax_amount),
        segment_surcharge_amount: parseFloat(rows[0].segment_surcharge_amount),
        segment_total_amount: parseFloat(rows[0].segment_total_amount),
      });
    }

    const totalFromDB = segmentsFromDB.reduce(
      (acc, s) => acc + s.segment_total_amount,
      0
    );

    if (totalFromDB !== total_amount) {
      throw createHttpError(
        400,
        `The amount you tried to pay, ${total_amount}, does not match the true amount, ${totalFromDB}, at this moment`
      );
    }

    return segmentsFromDB;
  }

  async handleBookingIntent({
    user_id,
    passengers,
    segments,
    total_amount,
    receipt_email,
  }: IBookingAndPaymentBody) {
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
        total_amount,
      });

      let segmentQueries: [string, any[]][] = [];
      let passengersAdded: {
        id?: number;
        nationality: string;
        passport_number: string;
      }[] = [];

      const seats: { flight_id: number; seat_id: number }[] = [];

      for (let i = 0; i < segments.length; i++) {
        // checking if seat available
        const seatId = await this.getAvailableSeatId(client, segments[i]);
        seats.push({ seat_id: seatId, flight_id: segments[i].flight_id });
        // adding passenger
        const { nationality, passport_number } = passengers[i];
        let passengerId = null;
        const passengerIndex = passengersAdded.findIndex(
          (p) =>
            p.nationality === nationality &&
            p.passport_number === passport_number
        );
        if (passengerIndex === -1) {
          const newPassengerId = await this.insertPassenger(passengers[i]);
          passengersAdded.push({
            id: newPassengerId,
            nationality,
            passport_number,
          });
          passengerId = newPassengerId;
        } else {
          passengerId = passengersAdded[passengerIndex].id;
        }

        // will add segments after adding booking
        segmentQueries.push([
          "insert into booking_segments (booking_id, passenger_id, flight_id, seat_id, base_amount, tax_amount, surcharge_amount, total_amount) values ($1, $2, $3, $4, $5, $6, $7, $8) returning *",
          [
            // booking id inserted later in the array,
            passengerId,
            segments[i].flight_id,
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
        currency: "usd",
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
      });

      console.log("\n === COMMITTING === \n");

      await client.query("commit");

      return {
        // ...insertedBooking,
        // segments: segmentsReturned,
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
}

export const bookingsService = new BookingsService(paymentsService);
