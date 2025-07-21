import { IAddFlightFares, IFlightFares, addSchema } from "./flight_fares.types";
import FlightFaresService from "./flight_fares.service";
import BaseController from "../../global/BaseController";

const flightFaresService = new FlightFaresService();

class FlightFaresController extends BaseController<
  IFlightFares,
  IAddFlightFares
> {
  declare service: FlightFaresService;
  constructor() {
    super(flightFaresService, addSchema);
    this.service = flightFaresService;
    this.addSchema = addSchema;
  }
}

export default FlightFaresController;
