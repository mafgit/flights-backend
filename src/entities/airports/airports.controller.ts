import { IAddAirport, IAirport, addSchema } from "./airports.types";
import AirportsService from "./airports.service";
import BaseController from "../../global/BaseController";

const airportsService = new AirportsService();

class AirportsController extends BaseController<IAirport, IAddAirport> {
  declare service: AirportsService
  constructor() {
    super(airportsService, addSchema);
    this.service = airportsService
    this.addSchema = addSchema
  }
}

export default AirportsController;
