import { IAddPayment, IPaymentStatus } from "./payments.types";
import pool from "../../database/db";
import createHttpError from "http-errors";
import { Pool, PoolClient } from "pg";
import { stripe } from "../..";
import { ISegment, IBookingStatus } from "../bookings/bookings.types";

export default class PaymentsService {
  async insertPayment(data: IAddPayment, client: PoolClient | Pool = pool) {
    const { rows } = await client.query(
      "insert into payments (user_id, stripe_payment_intent_id, booking_id, total_amount, currency, method, status, guest_email) values ($1, $2, $3, $4, $5, $6, $7) returning *",
      [
        data.user_id,
        data.stripe_payment_intent_id,
        data.booking_id,
        data.total_amount,
        data.currency,
        data.method,
        data.status,
        data.guest_email,
      ]
    );

    return rows[0].id;
  }

  async validatePaymentAttempts({
    booking_id,
    guest_email,
    user_id,
  }: {
    booking_id: number;
    guest_email?: string;
    user_id?: number;
  }) {
    const { rows } = await pool.query(
      "select status from payments where booking_id = $1 and (user_id = $2 or guest_email = $3)",
      [booking_id, user_id, guest_email]
    );
    if (rows.some((r) => r.status === "paid"))
      throw createHttpError(400, "Payment already made");
    if (rows.filter((r) => r.status === "failed").length > 3)
      throw createHttpError(400, "Failed due to too many payment attempts");
    return true; // todo
  }

  async handlePaymentIntent({
    segments,
    total_amount,
    guest_email,
    user_id,
    adults,
    children,
    infants,
    booking_id,
    seats,
  }: {
    segments: ISegment[];
    total_amount: number;
    guest_email?: string;
    user_id?: number;
    adults: number;
    children: number;
    infants: number;
    booking_id: number;
    seats: { flight_id: number; seat_id: number }[];
  }) {
    if (!guest_email && !user_id)
      throw createHttpError(400, "Neither guest email not user id provided");
    // todo: client instead of pool in booking and payment
    try {
      await this.validatePaymentAttempts({ booking_id, guest_email, user_id });

      const intent = await stripe.paymentIntents.create({
        amount: total_amount,
        currency: "usd", // todo: check currency?
        automatic_payment_methods: { enabled: true },
        metadata: {
          adults,
          children,
          infants,
          booking_id: booking_id,
          segments: JSON.stringify(segments),
          seats: JSON.stringify(seats),
          guest_email: guest_email ?? null,
          user_id: user_id ?? null,
        },
      });

      return {
        clientSecret: intent.client_secret,
      };
    } catch (error) {
      console.error(error);
      throw createHttpError(500, "Error creating stripe payment intent");
    }
  }

  async webhookHandler(signature: string, body: string | Buffer) {
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (error) {
      throw createHttpError(400, "Webhook Error");
    }

    if (
      event.type === "payment_intent.succeeded" ||
      event.type === "payment_intent.payment_failed"
    ) {
      const { object } = event.data;
      console.log("\n------------\nMetadata received", object.metadata);
      const booking_id = parseInt(object.metadata.booking_id);
      const user_id = parseInt(object.metadata.user_id);
      let bookingStatus: IBookingStatus = "confirmed";
      let paymentStatus: IPaymentStatus = "paid";

      if (event.type === "payment_intent.succeeded") {
        // todo: do these in a transaction
        await this.setSeatsUnavailable(JSON.parse(object.metadata.seats));
        console.log("PAYMENT INTENT SUCCEEDED");
      } else if (event.type === "payment_intent.payment_failed") {
        paymentStatus = "failed";
        bookingStatus = "cancelled"; // todo: or pending?
        console.log("\n------------\nMetadata received", object.metadata);
        console.log("PAYMENT INTENT FAILED");
      }

      await this.updateBooking(booking_id, bookingStatus);
      await this.insertPayment({
        booking_id,
        currency: object.metadata.currency,
        total_amount: object.amount,
        method: "credit_card", // todo: check
        status: paymentStatus,
        user_id,
        guest_email: object.metadata.guest_email,
        stripe_payment_intent_id: object.id,
      });
    }

    return true;
  }

  private async setSeatsUnavailable(
    seats: { flight_id: number; seat_id: number }[]
  ) {
    for (let i = 0; i < seats.length; i++) {
      await pool.query(
        "update seats set is_available = false where id = $1 and flight_id = $2",
        [seats[i].seat_id, seats[i].flight_id]
      );
    }
  }

  async updateBooking(bookingId: number, status: IBookingStatus) {
    await pool.query("update bookings set status = $1 where id = $2;", [
      status,
      bookingId,
    ]);
  }
}

export const paymentsService = new PaymentsService();
