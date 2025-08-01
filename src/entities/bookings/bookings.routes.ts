import { Router } from "express";
import {
  optionalLoggedIn,
  verifyCorrectUserOrAdmin,
  verifyLoggedIn,
} from "../../global/middlewares/verifyLoggedIn";
import { verifyAdmin } from "../../global/middlewares/verifyAdmin";
import BookingsController from "./bookings.controller";
import asyncHandler from "express-async-handler";

const bookingsController = new BookingsController();
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
  asyncHandler(bookingsController.getMyBookings)
);

router.post(
  "/create-booking-intent",
  optionalLoggedIn,
  asyncHandler(bookingsController.handleBookingIntent)
);

// router.get(
//   "/:id",
//   verifyLoggedIn,
//   verifyCorrectUserOrAdmin("bookings"),
//   asyncHandler(bookingsController.getById)
// );

export default router;
