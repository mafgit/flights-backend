import { IAddPayment, IPayment, addSchema } from "./payments.types";
import PaymentsService, { paymentsService } from "./payments.service";
import BaseController from "../../global/BaseController";

class PaymentsController extends BaseController<IPayment, IAddPayment> {
  declare service: PaymentsService
  constructor() {
    super(paymentsService, addSchema);
    this.service = paymentsService;
    this.addSchema = addSchema;
  }
}

export default PaymentsController;
