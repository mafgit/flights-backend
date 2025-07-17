import { Router } from "express";
import { verifyLoggedIn } from "../../global/middlewares/verifyLoggedIn";
import { verifyAdmin } from "../../global/middlewares/verifyAdmin";
import AirportsController from "./airports.controller";
import asyncHandler from "express-async-handler";

const airportsController = new AirportsController();
const router = Router();

router.get("/", asyncHandler(airportsController.getAll));
router.post(
  "/add",
  verifyLoggedIn,
  verifyAdmin,
  asyncHandler(airportsController.add)
);
router.delete(
  "/delete/:id",
  verifyLoggedIn,
  verifyAdmin,
  asyncHandler(airportsController.delete)
);
router.put(
  "/update/:id",
  verifyLoggedIn,
  verifyAdmin,
  asyncHandler(airportsController.update)
);
router.get("/:id", asyncHandler(airportsController.getById));

export default router;
