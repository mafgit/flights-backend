import { IAddAirline, IAirline, addSchema } from "./airlines.types";
import AirlinesService from "./airlines.service";
import BaseController from "../../global/BaseController";

const airlinesService = new AirlinesService();

class AirlinesController extends BaseController<IAirline, IAddAirline> {
  declare service: AirlinesService;
  constructor() {
    super(airlinesService, addSchema);
    this.service = airlinesService;
    this.addSchema = addSchema;
  }
}

export default AirlinesController;
