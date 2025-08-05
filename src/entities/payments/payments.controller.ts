import PaymentsService from "./payments.service";
import { Response } from "express";
import { MyRequest } from "../auth/auth.types";
import { stripe } from "../..";

class PaymentsController {
  declare service: PaymentsService;
  constructor(paymentsService: PaymentsService) {
    this.service = paymentsService;
  }

  // paymentIntentHandler = async (req: MyRequest, res: Response) => {
  //   const body = bookingAndPaymentBodySchema.parse(req.body);

  //   const { clientSecret } = await this.service.handlePaymentIntent(body);

  //   res.json({
  //     clientSecret,
  //   });
  // };

  webhookHandler = async (req: MyRequest, res: Response) => {
    const signature = req.headers["stripe-signature"] as string;

    // console.log(" === SIGNATURE === \n", signature);
    // console.log(" === HOOKBODY === \n", req.body);
    // console.log(" +++ BUFFER +++", Buffer.isBuffer(req.body));

    await this.service.webhookHandler(signature, req.body);

    res.json({ received: true });
  };

  getBookingDataAfterSuccess = async (req: MyRequest, res: Response) => {
    const id = req.body.payment_intent_id;
    if (!id) throw new Error("No payment intent id provided");

    const metadata = await this.service.getBookingDataAfterSuccess(id);

    if (metadata.booking_id)
      res.json({
        booking_id: parseInt(metadata.booking_id),
      });
    else throw new Error("No booking id found in metadata");
  };
}

export default PaymentsController;
