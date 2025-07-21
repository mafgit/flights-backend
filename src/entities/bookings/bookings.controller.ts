import { IAddBooking, IBooking, addSchema } from "./bookings.types";
import BookingsService from "./bookings.service";
import BaseController from "../../global/BaseController";
import { Response } from "express";
import { AuthRequest } from "../auth/auth.types";
import { paymentsService } from "../payments/payments.service";
import createHttpError from "http-errors";

const bookingsService = new BookingsService(paymentsService);

class BookingsController extends BaseController<IBooking, IAddBooking> {
  declare service: BookingsService; // overriding service of base

  constructor() {
    super(bookingsService, addSchema);
    this.service = bookingsService;
    this.addSchema = addSchema;
  }

  addWrapper = async (req: AuthRequest, res: Response) => {
    if ((req.role === "admin" || req.role === "super_admin") || (req.body.user_id === req.userId))
      return this.add(req, res);
    throw createHttpError(401, 'You are not authorized')
  };

  getMyBookings = async (req: AuthRequest, res: Response) => {
    const myBookings = await this.service.getMyBookings(req.userId!);
    res.json({ data: myBookings });
  };
}

// todo: make passengers entity folder as well

export default BookingsController;
