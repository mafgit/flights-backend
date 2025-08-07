import { Router } from "express";
import {
  optionalLoggedIn,
  verifyLoggedIn,
} from "../../global/middlewares/verifyLoggedIn";
import { verifyAdmin } from "../../global/middlewares/verifyAdmin";
import CartsController from "./carts.controller";
import asyncHandler from "express-async-handler";
import { getExchangeRate } from "../../global/middlewares/getExchangeRate";

const cartsController = new CartsController();
const router = Router();

// router.get(
//   "/",
//   verifyLoggedIn,
//   verifyAdmin,
//   asyncHandler(cartsController.getAll)
// );

router.post("/add", optionalLoggedIn, asyncHandler(cartsController.add));
router.get(
  "/get-one",
  optionalLoggedIn,
  getExchangeRate,
  asyncHandler(cartsController.getOne)
);

router.delete(
  "/delete",
  optionalLoggedIn,
  asyncHandler(cartsController.delete)
);

// router.put(
//   "/update/:id",
//   optionalLoggedIn,
//   asyncHandler(cartsController.update)
// );
// router.get("/:id", optionalLoggedIn, asyncHandler(cartsController.getById));

export default router;
