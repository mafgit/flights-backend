import { Router, json, raw } from "express";
import asyncHandler from "express-async-handler";

// import {
//   verifyCorrectUserOrAdmin,
//   verifyLoggedIn,
// } from "../../global/middlewares/verifyLoggedIn";
// import { verifyAdmin } from "../../global/middlewares/verifyAdmin";
// import { stripe } from "../..";
// import createHttpError from "http-errors";
// import z from "zod";
// import { segmentSchema } from "../bookings/bookings.types";
// import pool from "../../database/db";
// import { bookingAndPaymentBodySchema } from "./payments.types";
import PaymentsController from "./payments.controller";
import { paymentsService } from "./payments.service";

const paymentsController = new PaymentsController(paymentsService);

const router = Router();

// router.get(
//   "/",
//   verifyLoggedIn,
//   verifyAdmin,
//   asyncHandler(paymentsController.getAll)
// );
// router.post(
//   "/add",
//   verifyLoggedIn,
//   verifyAdmin,
//   asyncHandler(paymentsController.add)
// );
// // router.post(
// //   "/pay",
// //   verifyLoggedIn,
// //   verifyCorrectUserOrAdmin("payments"),
// //   asyncHandler(paymentsController.add)
// // );
// router.delete(
//   "/delete/:id",
//   verifyLoggedIn,
//   verifyAdmin,
//   asyncHandler(paymentsController.delete)
// );
// router.put(
//   "/update/:id",
//   verifyLoggedIn,
//   verifyAdmin,
//   asyncHandler(paymentsController.update)
// );
// router.get(
//   "/:id",
//   verifyLoggedIn,
//   verifyCorrectUserOrAdmin("payments"),
//   asyncHandler(paymentsController.getById)
// );

// router.post("/create-payment-intent", asyncHandler(paymentsController.paymentIntentHandler))

router.post(
  "/webhook",
  raw({ type: "application/json" }),
  asyncHandler(paymentsController.webhookHandler)
);
router.post(
  "/get-booking-data-after-success",
  json(),
  asyncHandler(paymentsController.getBookingDataAfterSuccess)
);
export default router;
