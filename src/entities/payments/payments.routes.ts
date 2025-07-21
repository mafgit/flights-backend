import { Router } from "express";
import {
  verifyCorrectUserOrAdmin,
  verifyLoggedIn,
} from "../../global/middlewares/verifyLoggedIn";
import { verifyAdmin } from "../../global/middlewares/verifyAdmin";
import PaymentsController from "./payments.controller";
import asyncHandler from "express-async-handler";

const paymentsController = new PaymentsController();
const router = Router();

router.get(
  "/",
  verifyLoggedIn,
  verifyAdmin,
  asyncHandler(paymentsController.getAll)
);
router.post(
  "/add",
  verifyLoggedIn,
  verifyAdmin,
  asyncHandler(paymentsController.add)
);
router.post(
  "/pay",
  verifyLoggedIn,
  verifyCorrectUserOrAdmin("payments"),
  asyncHandler(paymentsController.add)
);
router.delete(
  "/delete/:id",
  verifyLoggedIn,
  verifyAdmin,
  asyncHandler(paymentsController.delete)
);
router.put(
  "/update/:id",
  verifyLoggedIn,
  verifyAdmin,
  asyncHandler(paymentsController.update)
);
router.get(
  "/:id",
  verifyLoggedIn,
  verifyCorrectUserOrAdmin("payments"),
  asyncHandler(paymentsController.getById)
);

export default router;
