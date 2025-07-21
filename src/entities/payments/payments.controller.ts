import { IAddPayment, IPayment, addSchema } from "./payments.types";
import { paymentsService } from "./payments.service";
import BaseController from "../../global/BaseController";

class PaymentsController extends BaseController<IPayment, IAddPayment> {
  constructor() {
    super(paymentsService, addSchema);
    this.service = paymentsService;
    this.addSchema = addSchema;
  }
}

export default PaymentsController;
