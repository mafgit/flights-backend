import { Router } from "express";
import { verify_logged_in } from "../../global/middlewares/verify_logged_in";
import { verify_admin } from "../../global/middlewares/verify_admin";
import AirlinesController from "./airlines.controller";
import asyncHandler from "express-async-handler";

const airlines_controller = new AirlinesController();
const router = Router();

router.get("/", asyncHandler(airlines_controller.get_all));
router.post(
  "/add",
  verify_logged_in,
  verify_admin,
  asyncHandler(airlines_controller.add)
); // todo: verify that it is the correct admin that is adding to airline
router.delete(
  "/delete/:id",
  verify_logged_in,
  verify_admin,
  asyncHandler(airlines_controller.delete)
);
router.put(
  "/update/:id",
  verify_logged_in,
  verify_admin,
  asyncHandler(airlines_controller.update)
);
router.get("/:id", asyncHandler(airlines_controller.get_by_id));

export default router;
