import { ICart, addSchema } from "./carts.types";
import CartsService from "./carts.service";
import { MyRequest } from "../auth/auth.types";
import { Response } from "express";

const cartsService = new CartsService();

class CartsController {
  declare service: CartsService;
  constructor() {
    this.service = cartsService;
    // this.addSchema = addSchema;
  }

  getOne = async (req: MyRequest, res: Response) => {
    const data = await this.service.getOne(
      req.userId,
      req.cookies.sessionId,
      req.cookies.cartId
    );
    res.json({ data });
  };

  add = async (req: MyRequest, res: Response) => {
    const parsedBody = addSchema.parse(req.body);
    const { cart, segments, passengers } = await this.service.add(
      parsedBody,
      req.userId,
      req.cookies.sessionId
    );
    res.cookie("sessionId", cart.session_id);
    res.cookie("cartId", cart.id);
    res.json({ data: { cart, segments, passengers } });
  };

  // update = async (req: MyRequest, res: Response) => {

  // }
}

export default CartsController;
