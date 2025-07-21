import { Router } from "express";
import { verifyLoggedIn } from "../../global/middlewares/verifyLoggedIn";
import { verifyAdmin } from "../../global/middlewares/verifyAdmin";
import FlightFaresController from "./flight_fares.controller";
import asyncHandler from "express-async-handler";

const flightFaresController = new FlightFaresController();
const router = Router();

router.get("/", asyncHandler(flightFaresController.getAll));
router.post(
  "/add",
  verifyLoggedIn,
  verifyAdmin,
  asyncHandler(flightFaresController.add)
);
router.delete(
  "/delete/:id",
  verifyLoggedIn,
  verifyAdmin,
  asyncHandler(flightFaresController.delete)
);
router.put(
  "/update/:id",
  verifyLoggedIn,
  verifyAdmin,
  asyncHandler(flightFaresController.update)
);
router.get("/:id", asyncHandler(flightFaresController.getById));

export default router;
