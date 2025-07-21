import { Router } from "express";
import { verifyLoggedIn } from "../../global/middlewares/verifyLoggedIn";
import { verifyAdmin } from "../../global/middlewares/verifyAdmin";
import AircraftsController from "./aircrafts.controller";
import asyncHandler from "express-async-handler";

const aircraftsController = new AircraftsController();
const router = Router();

router.get("/", asyncHandler(aircraftsController.getAll));
router.post(
  "/add",
  verifyLoggedIn,
  verifyAdmin,
  asyncHandler(aircraftsController.add)
);
router.delete(
  "/delete/:id",
  verifyLoggedIn,
  verifyAdmin,
  asyncHandler(aircraftsController.delete)
);
router.put(
  "/update/:id",
  verifyLoggedIn,
  verifyAdmin,
  asyncHandler(aircraftsController.update)
);
router.get("/:id", asyncHandler(aircraftsController.getById));

export default router;
