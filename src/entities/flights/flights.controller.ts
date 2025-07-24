import {
  IAddFlight,
  IFlight,
  ISearchFlight,
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
    const parsedBody = searchSchema.parse(req.body.flights) as ISearchFlight[];
    const rows = await this.service.searchFlights(parsedBody);
    res.json({ data: rows });
  };
}

export default FlightsController;
