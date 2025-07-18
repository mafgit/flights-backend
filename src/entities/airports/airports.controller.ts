import { IAddAirport, IAirport, schema } from "./airports.types";
import AirportsService from "./airports.service";
import BaseController from "../../global/BaseController";

const airportsService = new AirportsService();

class AirportsController extends BaseController<IAirport, IAddAirport> {
  constructor() {
    super(airportsService, schema);
    this.service = airportsService
    this.addSchema = schema
  }
}

export default AirportsController;
