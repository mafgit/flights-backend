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
      req.exchangeRate!,
      req.userId,
      req.cookies.sessionId,
      req.cookies.cartId
    );

    res.json({ data });
  };

  add = async (req: MyRequest, res: Response) => {
    const parsedBody = addSchema.parse(req.body);
    const { cart, segments } = await this.service.add(
      parsedBody,
      req.userId,
      req.cookies.sessionId
    );
    res.cookie("sessionId", cart.session_id);
    res.cookie("cartId", cart.id);
    res.json({ data: { cart, segments } });
  };

  delete = async (req: MyRequest, res: Response) => {
    // const cartId = req.params.id ? parseInt(req.params.id) : undefined;
    const sessionId = req.cookies.sessionId;
    const userId = req.userId;

    await this.service.delete(sessionId, userId);
    res.json({ success: true });
  };

  // update = async (req: MyRequest, res: Response) => {

  // }
}

export default CartsController;
