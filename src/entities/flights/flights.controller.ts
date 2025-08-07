import { IAddFlight, IFlight, addSchema, searchSchema } from "./flights.types";
import FlightsService from "./flights.service";
import BaseController from "../../global/BaseController";
import { Request, Response } from "express";
import { MyRequest } from "../auth/auth.types";

const flightsService = new FlightsService();

class FlightsController extends BaseController<IFlight, IAddFlight> {
  declare service: FlightsService;
  constructor() {
    super(flightsService, addSchema);
    this.service = flightsService;
    this.addSchema = addSchema;
  }

  searchFlights = async (req: MyRequest, res: Response) => {
    const {
      flights,
      airlineIds,
      departureTimes,
      maxTotalDuration,
      passengers,
    } = searchSchema.parse(req.body);

    const rows = await this.service.searchFlights(
      req.exchangeRate!,
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
