import { Router } from "express";
import { login, me, signup, logout } from "./auth.controller";
import { verifyLoggedIn } from "../../global/middlewares/verifyLoggedIn";
import asyncHandler from "express-async-handler";

const router = Router();

router.post("/login", asyncHandler(login));
router.post("/signup", asyncHandler(signup));
router.post("/logout", verifyLoggedIn, asyncHandler(logout));
router.get("/me", verifyLoggedIn, asyncHandler(me));

export default router;
