import { Router } from "express";
import {
  login,
  me,
  signup,
  logout,
  getAutoBookingData,
} from "./auth.controller";
import { verifyLoggedIn } from "../../global/middlewares/verifyLoggedIn";
import asyncHandler from "express-async-handler";

const router = Router();

router.post("/login", asyncHandler(login));
router.post("/signup", asyncHandler(signup));
router.post("/logout", verifyLoggedIn, asyncHandler(logout));
router.get("/me", verifyLoggedIn, asyncHandler(me));
router.get(
  "/auto-booking-data",
  verifyLoggedIn,
  asyncHandler(getAutoBookingData)
);

export default router;
