import { Router } from "express";
import { verifyLoggedIn } from "../../global/middlewares/verifyLoggedIn";
import { verifyAdmin } from "../../global/middlewares/verifyAdmin";
import PaymentsController from "./payments.controller";
import asyncHandler from "express-async-handler";

const paymentsController = new PaymentsController();
const router = Router();

router.get("/", asyncHandler(paymentsController.getAll));
router.post(
  "/add",
  verifyLoggedIn,
  verifyAdmin,
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
router.get("/:id", asyncHandler(paymentsController.getById));

export default router;
