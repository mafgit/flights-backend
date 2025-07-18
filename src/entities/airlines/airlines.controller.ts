import { IAddAirline, IAirline, schema } from "./airlines.types";
import AirlinesService from "./airlines.service";
import BaseController from "../../global/BaseController";

const airlinesService = new AirlinesService();

class AirlinesController extends BaseController<IAirline, IAddAirline> {
  constructor() {
    super(airlinesService, schema);
    this.service = airlinesService;
    this.addSchema = schema;
  }
}

export default AirlinesController;
