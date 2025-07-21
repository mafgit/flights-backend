import { Router } from "express";
import {
  verifyCorrectUserOrAdmin,
  verifyLoggedIn,
} from "../../global/middlewares/verifyLoggedIn";
import { verifyAdmin } from "../../global/middlewares/verifyAdmin";
import UsersController from "./users.controller";
import asyncHandler from "express-async-handler";

const usersController = new UsersController();
const router = Router();

router.get(
  "/",
  verifyLoggedIn,
  verifyAdmin,
  asyncHandler(usersController.getAll)
);
router.post(
  "/add",
  verifyLoggedIn,
  verifyAdmin,
  asyncHandler(usersController.add)
);
router.delete(
  "/delete/:id",
  verifyLoggedIn,
  verifyAdmin,
  asyncHandler(usersController.delete)
);
router.put(
  "/update/:id",
  verifyLoggedIn,
  verifyCorrectUserOrAdmin("users"),
  asyncHandler(usersController.update)
);
router.put(
  "/update-password/:id",
  verifyLoggedIn,
  verifyCorrectUserOrAdmin("users"),
  asyncHandler(usersController.updatePassword)
);
router.put(
  "/update-role/:id",
  verifyLoggedIn,
  verifyAdmin,
  asyncHandler(usersController.updateRole)
);
router.get("/:id", asyncHandler(usersController.getById));

export default router;
