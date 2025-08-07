import { Router } from "express";
import { verifyLoggedIn } from "../../global/middlewares/verifyLoggedIn";
import { verifyAdmin } from "../../global/middlewares/verifyAdmin";
import FlightsController from "./flights.controller";
import asyncHandler from "express-async-handler";
import { getExchangeRate } from "../../global/middlewares/getExchangeRate";

const flightsController = new FlightsController();
const router = Router();

router.get("/", getExchangeRate, asyncHandler(flightsController.getAll));
router.post(
  "/search",
  getExchangeRate,
  asyncHandler(flightsController.searchFlights)
);
router.post(
  "/add",
  verifyLoggedIn,
  verifyAdmin,
  asyncHandler(flightsController.add)
);
router.delete(
  "/delete/:id",
  verifyLoggedIn,
  verifyAdmin,
  asyncHandler(flightsController.delete)
);
router.put(
  "/update/:id",
  verifyLoggedIn,
  verifyAdmin,
  asyncHandler(flightsController.update)
);
router.get("/:id", getExchangeRate, asyncHandler(flightsController.getById));

export default router;
