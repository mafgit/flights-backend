import { IAddAircraft, IAircraft, addSchema } from "./aircrafts.types";
import AircraftsService from "./aircrafts.service";
import BaseController from "../../global/BaseController";

const aircraftsService = new AircraftsService();

class AircraftsController extends BaseController<IAircraft, IAddAircraft> {
  declare service: AircraftsService
  constructor() {
    super(aircraftsService, addSchema);
    this.service = aircraftsService
    this.addSchema = addSchema
  }
}

export default AircraftsController;
