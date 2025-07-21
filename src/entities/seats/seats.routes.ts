import { Router } from "express";
import { verifyLoggedIn } from "../../global/middlewares/verifyLoggedIn";
import { verifyAdmin } from "../../global/middlewares/verifyAdmin";
import SeatsController from "./seats.controller";
import asyncHandler from "express-async-handler";

const seatsController = new SeatsController();
const router = Router();

router.get("/", asyncHandler(seatsController.getAll));
// router.post(
//   "/add",
//   verifyLoggedIn,
//   verifyAdmin,
//   asyncHandler(seatsController.add)
// );
router.post(
  "/addAll",
  verifyLoggedIn,
  verifyAdmin,
  asyncHandler(seatsController.addAll)
);
router.delete(
  "/delete/:id",
  verifyLoggedIn,
  verifyAdmin,
  asyncHandler(seatsController.delete)
);
router.put(
  "/update/:id",
  verifyLoggedIn,
  verifyAdmin,
  asyncHandler(seatsController.update)
);
router.get("/:id", asyncHandler(seatsController.getById));

export default router;
