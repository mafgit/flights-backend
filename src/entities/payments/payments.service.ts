import { IAddPayment, IPayment } from "./payments.types";
import pool from "../../database/db";
import BaseService from "../../global/BaseService";
import createHttpError from "http-errors";

export default class PaymentsService extends BaseService<
  IPayment,
  IAddPayment
> {
  constructor() {
    super("payments", {
      user_id: "number",
      booking_id: "number",
      total_amount: "number",
      currency: "string",
      method: "string",
      status: "string",
    });
  }

  async add(data: IAddPayment) {
    const { rows } = await pool.query(
      "insert into payments (user_id, booking_id, total_amount, currency, method, status) values ($1, $2, $3, $4, $5, $6) returning *",
      [
        data.user_id,
        data.booking_id,
        data.total_amount,
        data.currency,
        data.method,
        data.status || "pending",
      ]
    );

    return rows[0].id;
  }

  async pay(paidPayment: IPayment) {
    try {
      await pool.query("begin");
      const { rows } = await pool.query(
        "select * from payments where booking_id = $1 and method = $2 and total_amount = $3 for update",
        [paidPayment.booking_id, paidPayment.method, paidPayment.total_amount]
      );

      if (rows.length === 0)
        throw createHttpError(400, "No payment was pending");

      // verify who is paying
      if (paidPayment.user_id !== rows[0].user_id)
        throw createHttpError(401, "You are not permitted to pay this payment");

      if (rows.some((r) => r.status === "paid"))
        throw createHttpError(400, "Payment already paid");

      if (rows.filter((r) => r.status === "failed").length >= 3)
        throw createHttpError(400, "Payment has already failed too many times");

      await this.add({ ...paidPayment, status: "paid" });
      // todo: return extra amount

      const { rows: updatedBookings } = await pool.query(
        "update bookings set status = 'confirmed' where id = $1 returning *",
        [paidPayment.booking_id]
      );

      if (updatedBookings.length === 0)
        throw createHttpError(500, "Unexpected error");

      await pool.query("commit");
      return updatedBookings[0];
    } catch (error) {
      await pool.query("rollback");
      await this.add({ ...paidPayment, status: "failed" }); // check if failed X times then cancel the booking and booking segments and release seats (maybe in a new transaction)
      throw error;
    }
  }
}

export const paymentsService = new PaymentsService();
