import { Router } from "express";
import {
  optionalLoggedIn,
  verifyCorrectUserOrAdmin,
  verifyLoggedIn,
} from "../../global/middlewares/verifyLoggedIn";
import { verifyAdmin } from "../../global/middlewares/verifyAdmin";
import BookingsController from "./bookings.controller";
import asyncHandler from "express-async-handler";
import { bookingsService } from "./bookings.service";
import { getExchangeRate } from "../../global/middlewares/getExchangeRate";

const bookingsController = new BookingsController(bookingsService);
const router = Router();

// router.get(
//   "/",
//   verifyLoggedIn,
//   verifyAdmin,
//   asyncHandler(bookingsController.getAll)
// );
// router.post("/add", verifyLoggedIn, asyncHandler(bookingsController.addWrapper));
// router.delete(
//   "/delete/:id",
//   verifyLoggedIn,
//   verifyAdmin,
//   asyncHandler(bookingsController.delete)
// );
// router.put(
//   "/update/:id",
//   verifyLoggedIn,
//   verifyAdmin,
//   asyncHandler(bookingsController.update)
// );
router.get(
  "/my-bookings",
  verifyLoggedIn,
  getExchangeRate,
  asyncHandler(bookingsController.getMyBookings)
);

router.post(
  "/create-booking-intent",
  optionalLoggedIn,
  getExchangeRate,
  asyncHandler(bookingsController.handleBookingIntent)
);

router.get(
  "/get-one/:id",
  optionalLoggedIn,
  getExchangeRate,
  asyncHandler(bookingsController.getOneBooking)
);

// router.get(
//   "/:id",
//   verifyLoggedIn,
//   verifyCorrectUserOrAdmin("bookings"),
//   asyncHandler(bookingsController.getById)
// );

export default router;
