import {
  IAddFlight,
  IFlight,
  addSchema,
  searchSchema,
} from "./flights.types";
import FlightsService from "./flights.service";
import BaseController from "../../global/BaseController";
import { Request, Response } from "express";

const flightsService = new FlightsService();

class FlightsController extends BaseController<IFlight, IAddFlight> {
  declare service: FlightsService;
  constructor() {
    super(flightsService, addSchema);
    this.service = flightsService;
    this.addSchema = addSchema;
  }

  searchFlights = async (req: Request, res: Response) => {
    const {
      flights,
      airlineIds,
      departureTimes,
      maxTotalDuration,
      passengers,
    } = searchSchema.parse(req.body);

    const rows = await this.service.searchFlights(
      flights,
      passengers,
      departureTimes,
      airlineIds,
      maxTotalDuration
    );
    res.json({ data: rows });
  };
}

export default FlightsController;
