import { Router } from "express";
import { verifyLoggedIn } from "../../global/middlewares/verifyLoggedIn";
import { verifyAdmin } from "../../global/middlewares/verifyAdmin";
import UsersController from "./users.controller";
import asyncHandler from "express-async-handler";

const usersController = new UsersController();
const router = Router();

router.get("/", asyncHandler(usersController.getAll));
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
  verifyAdmin,
  asyncHandler(usersController.update)
);
router.put(
  "/update-password/:id",
  verifyLoggedIn,
  verifyAdmin,
  asyncHandler(usersController.updatePassword)
);
// todo: make separation logic so that only admin can update role, but user can update other fields
// todo: verify that it is the same user who is updating and not someone else
router.get("/:id", asyncHandler(usersController.getById));

export default router;
