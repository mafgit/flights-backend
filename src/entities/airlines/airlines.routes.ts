import { Router } from "express";
import { verifyLoggedIn } from "../../global/middlewares/verifyLoggedIn";
import { verifyAdmin } from "../../global/middlewares/verifyAdmin";
import AirlinesController from "./airlines.controller";
import asyncHandler from "express-async-handler";

const airlinesController = new AirlinesController();
const router = Router();

router.get("/", asyncHandler(airlinesController.getAll));
router.post(
  "/add",
  verifyLoggedIn,
  verifyAdmin,
  asyncHandler(airlinesController.add)
); // todo?: verify that it is the correct admin that is adding to airline (if i add airline admins)
router.delete(
  "/delete/:id",
  verifyLoggedIn,
  verifyAdmin,
  asyncHandler(airlinesController.delete)
);
router.put(
  "/update/:id",
  verifyLoggedIn,
  verifyAdmin,
  asyncHandler(airlinesController.update)
);
router.get("/:id", asyncHandler(airlinesController.getById));

export default router;
