import { Request, Response } from "express";
import { IAirport } from "./airports.types";
import { validateAddBody, validateUpdateBody } from "./airports.utils";
import AirportsService from "./airports.service";
import { getIdFromParams } from "../../global/utils";
import BaseController from "../../global/BaseController";

const airportsService = new AirportsService();

class AirportsController extends BaseController<IAirport> {
  constructor() {
    super(airportsService);
  }

  async add(req: Request, res: Response) {
    const parsedBody = validateAddBody(req.body);
    const row = await airportsService.add(parsedBody);
    res.status(201).json({ data: row });
  }

  async update(req: Request, res: Response) {
    const parsedBody = validateUpdateBody(req.body);
    const id = getIdFromParams(req);
    const row = await this.service.update(parsedBody, id);
    res.json({ data: row });
  }
}

export default AirportsController;
