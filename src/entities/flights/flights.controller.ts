import { IAddFlight, IFlight, addSchema, searchSchema } from "./flights.types";
import FlightsService from "./flights.service";
import BaseController from "../../global/BaseController";
import { Request, Response } from "express";
import { MyRequest } from "../auth/auth.types";
import createHttpError from "http-errors";

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

  getCities = async (req: MyRequest, res: Response) => {
    if (!req.city || !req.country_name || !req.country)
      throw createHttpError(400, "No city or country in cookies");

    const data = await this.service.getCities(
      req.exchangeRate!,
      req.city,
      req.country_name,
      req.country
    );
    res.json({ data });
  };

  getCityImages = async (req: Request, res: Response) => {
    const data = await this.service.getCityImages(req.body.cities);
    res.json({ data });
  };
}

export default FlightsController;
