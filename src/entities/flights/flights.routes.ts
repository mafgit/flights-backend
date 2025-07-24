import { Router } from "express";
import { verifyLoggedIn } from "../../global/middlewares/verifyLoggedIn";
import { verifyAdmin } from "../../global/middlewares/verifyAdmin";
import FlightsController from "./flights.controller";
import asyncHandler from "express-async-handler";

const flightsController = new FlightsController();
const router = Router();

router.get("/", asyncHandler(flightsController.getAll));
router.post("/search", asyncHandler(flightsController.searchFlights));
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
router.get("/:id", asyncHandler(flightsController.getById));

export default router;
