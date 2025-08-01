import PaymentsService from "./payments.service";
import { Response } from "express";
import { MyRequest } from "../auth/auth.types";

class PaymentsController {
  declare service: PaymentsService;
  constructor() {}

  // paymentIntentHandler = async (req: MyRequest, res: Response) => {
  //   const body = bookingAndPaymentBodySchema.parse(req.body);

  //   const { clientSecret } = await this.service.handlePaymentIntent(body);

  //   res.json({
  //     clientSecret,
  //   });
  // };

  webhookHandler = async (req: MyRequest, res: Response) => {
    const signature = req.headers["stripe-signature"] as string;

    await this.service.webhookHandler(signature, req.body);

    res.json({ received: true });
  };
}

export default PaymentsController;
