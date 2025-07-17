import { Router } from "express";
import { login, me, signup, logout } from "./auth.controller";
import { verify_logged_in } from "../../global/middlewares/verify_logged_in";
import asyncHandler from "express-async-handler";

const router = Router();

router.post("/login", asyncHandler(login));
router.post("/signup", asyncHandler(signup));
router.post("/logout", verify_logged_in, asyncHandler(logout));
router.get("/me", verify_logged_in, asyncHandler(me));

export default router;
