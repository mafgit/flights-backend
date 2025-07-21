import { IAddBooking, IBooking, addSchema } from "./bookings.types";
import BookingsService from "./bookings.service";
import BaseController from "../../global/BaseController";
import { Response } from "express";
import { AuthRequest } from "../auth/auth.types";
import { paymentsService } from "../payments/payments.service";

const bookingsService = new BookingsService(paymentsService);

class BookingsController extends BaseController<IBooking, IAddBooking> {
  declare service: BookingsService; // overriding service of base
  
  constructor() {
    super(bookingsService, addSchema);
    this.service = bookingsService;
    this.addSchema = addSchema;
  }

  getMyBookings = async (req: AuthRequest, res: Response) => {
    const myBookings = await this.service.getMyBookings(req.userId!);
    res.json({ data: myBookings });
  };
}

export default BookingsController;
