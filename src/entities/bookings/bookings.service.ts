import { IAddBooking, IBooking, IPassenger, ISegment } from "./bookings.types";
import pool from "../../database/db";
import BaseService from "../../global/BaseService";
import createHttpError from "http-errors";
import PaymentsService from "../payments/payments.service";
import { PoolClient } from "pg";

export default class BookingsService extends BaseService<
  IBooking,
  IAddBooking
> {
  declare paymentsService: PaymentsService;
  constructor(paymentsService: PaymentsService) {
    super("bookings", {
      user_id: "number",
      // booking_code: "string",
      total_amount: "number",
      currency: "string",
      status: "string",
    });

    this.paymentsService = paymentsService;
  }

  private async insertPassenger(passenger: IPassenger) {
    const { rows: insertedPassengers } = await pool.query(
      "insert into passengers (date_of_birth, full_name, gender, nationality, passport_number) values ($1, $2, $3, $4, $5) returning *",
      [
        passenger.date_of_birth,
        passenger.full_name,
        passenger.gender,
        passenger.nationality,
        passenger.passport_number,
      ]
    );

    return insertedPassengers[0].id;
  }

  private async getFlightFares(client: PoolClient, segment: ISegment) {
    const { rows } = await client.query(
      "select base_amount, tax_amount, surcharge_amount from flight_fares where flight_id = $1 and seat_class = $2",
      [segment.flight_id, segment.seat_class]
    );

    if (rows.length === 0)
      throw createHttpError(400, "Invalid flight or seat class");

    return rows;
  }

  private async setSeatUnavailable(client: PoolClient, seatId: number) {
    // updating seat to unavailable
    await client.query("update seats set is_available = false where id = $1", [
      seatId,
    ]);
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
    user_id: number,
    total_surcharge_amount: number,
    total_base_amount: number,
    total_tax_amount: number,
    total_amount: number,
    currency: string,
    ip_address: string
  ) {
    const { rows: insertedBookings } = await client.query<IBooking>(
      "insert into bookings (user_id, total_amount, surcharge_amount, base_amount, tax_amount, currency, ip_address) values($1, $2, $3, $4, $5, $6, $7) returning *",
      [
        user_id,
        total_amount,
        total_surcharge_amount,
        total_base_amount,
        total_tax_amount,
        currency,
        ip_address,
      ]
    ); // todo: check currency

    return insertedBookings[0];
  }

  private async insertAllSegments(
    client: PoolClient,
    bookingId: number,
    segmentQueries: [string, any[]][]
  ) {
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

  async add(data: IAddBooking) {
    if (data.segments.length === 0)
      throw createHttpError(400, "No segments provided");

    let total_base_amount = 0;
    let total_tax_amount = 0;
    let total_surcharge_amount = 0;
    let segmentQueries: [string, any[]][] = [];
    let passengersAdded: {
      id?: number;
      nationality: string;
      passport_number: string;
    }[] = [];

    const client = await pool.connect();
    try {
      await client.query("begin");
      for (let i = 0; i < data.segments.length; i++) {
        // getting fares for each segment
        const fares = await this.getFlightFares(client, data.segments[i]);
        // checking if seat available
        const seatId = await this.getAvailableSeatId(client, data.segments[i]);

        // adding passenger
        const { nationality, passport_number } = data.passengers[i];
        let passengerId = null;
        const passengerIndex = passengersAdded.findIndex(
          (p) =>
            p.nationality === nationality &&
            p.passport_number === passport_number
        );
        if (passengerIndex === -1) {
          const newPassengerId = await this.insertPassenger(data.passengers[i]);
          passengersAdded.push({
            id: newPassengerId,
            nationality,
            passport_number,
          });
          passengerId = newPassengerId;
        } else {
          passengerId = passengersAdded[passengerIndex].id;
        }

        await this.setSeatUnavailable(client, seatId);

        const { base_amount, tax_amount, surcharge_amount } = fares[0];
        total_base_amount += base_amount;
        total_tax_amount += tax_amount;
        total_surcharge_amount += surcharge_amount;

        // will add segments after adding booking
        segmentQueries.push([
          "insert into booking_segments (booking_id, passenger_id, flight_id, seat_id, base_amount, tax_amount, surcharge_amount, total_amount) values ($1, $2, $3, $4, $5, $6, $7, $8) returning *",
          [
            // booking id inserted later in the array,
            passengerId,
            data.segments[i].flight_id,
            seatId,
            base_amount,
            tax_amount,
            surcharge_amount,
            base_amount + tax_amount + surcharge_amount,
          ],
        ]);
      }

      const total_amount =
        total_base_amount + total_tax_amount + total_surcharge_amount;
      // adding booking
      const insertedBooking = await this.insertBooking(
        client,
        data.user_id,
        total_surcharge_amount,
        total_base_amount,
        total_tax_amount,
        total_amount,
        "PKR",
        data.ip_address
      );
      const { id: bookingId } = insertedBooking;

      const segmentsReturned = await this.insertAllSegments(
        client,
        bookingId,
        segmentQueries
      );

      this.paymentsService.add({
        booking_id: bookingId,
        currency: "PKR",
        total_amount,
        method: "cash",
        status: "pending",
        user_id: data.user_id,
      }, client);

      await client.query("commit");

      return {
        ...insertedBooking,
        segments: segmentsReturned,
      };
    } catch (error) {
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
