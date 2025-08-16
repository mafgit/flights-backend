import { IAddPayment, IPaymentStatus } from "./payments.types";
import pool from "../../database/db";
import createHttpError from "http-errors";
import { Pool, PoolClient } from "pg";
import { stripe } from "../..";
import { ISegment, IBookingStatus } from "../bookings/bookings.types";

// currencies in which we do not multiply by 100 before sending to stripe
const zeroDecimalCurrencies = [
  "BIF",
  "CLP",
  "DJF",
  "GNF",
  "JPY",
  "KMF",
  "KRW",
  "MGA",
  "PYG",
  "RWF",
  "UGX",
  "VND",
  "VUV",
  "XAF",
  "XOF",
  "XPF",
];

export default class PaymentsService {
  async insertPayment(client: PoolClient, data: IAddPayment) {
    const { rows } = await client.query(
      "insert into payments (stripe_payment_intent_id, booking_id, total_amount, currency, method, status) values ($1, $2, $3, $4, $5, $6) returning *",
      [
        data.stripe_payment_intent_id,
        data.booking_id,
        data.total_amount,
        data.currency,
        data.method,
        data.status,
      ]
    );

    return rows[0].id;
  }

  async validatePaymentAttempts({
    booking_id,
    receipt_email,
    user_id,
  }: {
    booking_id: number;
    receipt_email?: string;
    user_id?: number;
  }) {
    const { rows } = await pool.query(
      "select status from payments where booking_id = $1 and (user_id = $2 or receipt_email = $3)",
      [booking_id, user_id, receipt_email]
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
    receipt_email,
    user_id,
    adults,
    children,
    infants,
    booking_id,
    seats,
    currency,
  }: {
    segments: ISegment[];
    total_amount: number;
    receipt_email?: string;
    user_id?: number;
    adults: number;
    children: number;
    infants: number;
    booking_id: number;
    seats: { flight_id: number; seat_id: number | undefined }[];
    currency: string;
  }) {
    console.log("\n === PAYMENT SERVICE CALLED === \n");

    if (!receipt_email && !user_id)
      throw createHttpError(400, "Neither guest email not user id provided");
    // todo: client instead of pool in booking and payment
    try {
      // await this.validatePaymentAttempts({ booking_id, receipt_email, user_id }); // todo: check

      const intent = await stripe.paymentIntents.create({
        amount: Math.round(
          total_amount * (zeroDecimalCurrencies.includes(currency) ? 1 : 100)
        ),
        currency: currency,
        automatic_payment_methods: { enabled: true },
        receipt_email: receipt_email,
        metadata: {
          adults,
          children,
          infants,
          booking_id: booking_id,
          segments: JSON.stringify(segments),
          seats: JSON.stringify(seats),
          receipt_email: receipt_email ?? null,
          user_id: user_id ?? null,
        },
      });

      return {
        clientSecret: intent.client_secret,
        booking_id,
      };
    } catch (error) {
      console.error(error);
      throw createHttpError(500, "Error creating stripe payment intent");
    }
  }

  async webhookHandler(signature: string, body: string | Buffer) {
    let event;

    // console.log(
    //   `\n === WEBHOOK CALLED (ENV= ${process.env
    //     .STRIPE_WEBHOOK_SECRET!}) === \n`
    // );

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (error) {
      throw createHttpError(400, "Webhook Error");
    }

    // console.log(`\n === PAYMENT INTENT EVENT TYPE: ${event.type} === \n`);

    if (
      event.type === "payment_intent.succeeded" ||
      event.type === "payment_intent.payment_failed"
    ) {
      const { object } = event.data;
      // console.log("\n------------\nMetadata received", object.metadata);
      const booking_id = parseInt(object.metadata.booking_id);
      const user_id = parseInt(object.metadata.user_id) || undefined;
      let bookingStatus: IBookingStatus = "confirmed";
      let paymentStatus: IPaymentStatus = "paid";

      const client = await pool.connect();

      try {
        await client.query("begin");

        if (event.type === "payment_intent.succeeded") {
          // todo: do these in a transaction
          await this.setSeatsUnavailable(
            client,
            JSON.parse(object.metadata.seats)
          );
          console.log("PAYMENT INTENT SUCCEEDED IN WEBHOOK");
        } else if (event.type === "payment_intent.payment_failed") {
          paymentStatus = "failed";
          bookingStatus = "cancelled"; // todo: or pending?
          console.log("PAYMENT INTENT FAILED IN WEBHOOK");
        }

        // console.log({
        //   booking_id,
        //   currency: object.currency,
        //   total_amount: object.amount,
        //   method: "credit_card", // todo: check
        //   status: paymentStatus,
        //   user_id,
        //   receipt_email: object.metadata.receipt_email,
        //   stripe_payment_intent_id: object.id,
        // });

        await this.insertPayment(client, {
          booking_id,
          currency: object.currency,
          total_amount: Math.round(
            object.amount /
              (zeroDecimalCurrencies.includes(object.currency) ? 100 : 1)
          ),
          method: "credit_card", // todo: `check`
          status: paymentStatus,
          user_id,
          receipt_email: object.metadata.receipt_email,
          stripe_payment_intent_id: object.id,
        });
        console.log("+++ PAYMENT INSERTED IN DB +++");
        await this.updateBooking(client, booking_id, bookingStatus);
        console.log("+++ BOOKING STATUS UPDATED IN DB +++");
        await client.query("commit");
      } catch (error) {
        console.log(error);
        await client.query("rollback");
      } finally {
        client.release();
      }
    }

    return true;
  }

  private async setSeatsUnavailable(
    client: PoolClient,
    seats: { flight_id: number; seat_id: number }[]
  ) {
    console.log("\n === SETTING FOLLOWING SEATS UNAVAILABLE === \n");
    console.log(seats);

    for (let i = 0; i < seats.length; i++) {
      await client.query(
        "update seats set is_available = false where id = $1 and flight_id = $2",
        [seats[i].seat_id, seats[i].flight_id]
      );
    }

    console.log("\n +++ SEATS UPDATED IN DB +++ \n");
  }

  async updateBooking(
    client: PoolClient,
    bookingId: number,
    status: IBookingStatus
  ) {
    await client.query("update bookings set status = $1 where id = $2;", [
      status,
      bookingId,
    ]);
  }

  async getBookingDataAfterSuccess(id: string) {
    const { metadata } = await stripe.paymentIntents.retrieve(id);
    return metadata;
  }
}

export const paymentsService = new PaymentsService();
