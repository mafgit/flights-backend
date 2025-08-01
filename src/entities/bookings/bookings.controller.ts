import BookingsService from "./bookings.service";
import { Response } from "express";
import { MyRequest } from "../auth/auth.types";
import { bookingAndPaymentBodySchema } from "../payments/payments.types";

class BookingsController {
  declare service: BookingsService; // overriding service of base

  // addWrapper = async (req: MyRequest, res: Response) => {
  //   if ((req.role === "admin" || req.role === "super_admin") || (req.body.user_id === req.userId))
  //     return this.add(req, res);
  //   throw createHttpError(401, 'You are not authorized')
  // };

  getMyBookings = async (req: MyRequest, res: Response) => {
    const myBookings = await this.service.getMyBookings(req.userId!);
    res.json({ data: myBookings });
  };

  handleBookingIntent = async (req: MyRequest, res: Response) => {
    const data = bookingAndPaymentBodySchema.parse(req.body);
    const { clientSecret } = await this.service.handleBookingIntent(data);
    res.json({ clientSecret });
  };
}

// todo: make passengers entity folder as well

export default BookingsController;
